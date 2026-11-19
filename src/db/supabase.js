import { createClient } from '@supabase/supabase-js';
import { db } from './db';

const SUPABASE_URL_KEY = 'CENSUS_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'CENSUS_SUPABASE_ANON_KEY';
const DEFAULT_URL = 'https://yolzmlamagzlwfiievks.supabase.co';

/**
 * Normalizes Supabase Project URL by stripping '/rest/v1' or trailing slashes
 */
export const normalizeSupabaseUrl = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/\/rest\/v1\/?$/i, '') // remove /rest/v1/ or /rest/v1
    .replace(/\/+$/, '');           // remove trailing slashes
};

export const getSupabaseConfig = () => {
  let url = localStorage.getItem(SUPABASE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
  url = normalizeSupabaseUrl(url);
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
};

export const setSupabaseConfig = (rawUrl, anonKey) => {
  const cleanUrl = normalizeSupabaseUrl(rawUrl);
  localStorage.setItem(SUPABASE_URL_KEY, cleanUrl);
  localStorage.setItem(SUPABASE_ANON_KEY, (anonKey || '').trim());
};

export const getSupabaseClient = (customUrl, customKey) => {
  const url = customUrl ? normalizeSupabaseUrl(customUrl) : getSupabaseConfig().url;
  const anonKey = customKey !== undefined ? (customKey || '').trim() : getSupabaseConfig().anonKey;
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false }
    });
  } catch (err) {
    console.error('डेटाबेस इनिशियलाइज़ेशन त्रुटि:', err);
    return null;
  }
};

/**
 * REAL LIVE DATABASE CONNECTION TEST
 * Sends an actual HTTP request to Supabase to verify connectivity, schema tables, and API keys.
 * Returns exact status, latency in milliseconds, and human-friendly Hindi message.
 */
export const checkDatabaseConnection = async (customUrl, customKey) => {
  if (!navigator.onLine) {
    return {
      connected: false,
      code: 'OFFLINE',
      statusText: 'ऑफ़लाइन (इंटरनेट अनुपलब्ध)',
      message: 'डिवाइस इंटरनेट से कनेक्टेड नहीं है। सर्वेक्षण डेटा डिवाइस पर सुरक्षित रहेगा।',
      latency: 0
    };
  }

  const { url, anonKey } = customUrl !== undefined 
    ? { url: normalizeSupabaseUrl(customUrl), anonKey: (customKey || '').trim() }
    : getSupabaseConfig();

  if (!url || !anonKey) {
    return {
      connected: false,
      code: 'UNCONFIGURED',
      statusText: 'क्रेडेंशियल्स शेष',
      message: 'Supabase URL या Anon Key दर्ज नहीं है। सेटिंग्स (⚙️) में जाकर प्रोजेक्ट URL व Anon Key भरें।',
      latency: 0
    };
  }

  const client = getSupabaseClient(url, anonKey);
  if (!client) {
    return {
      connected: false,
      code: 'INVALID_URL',
      statusText: 'अमान्य URL',
      message: 'प्रोजेक्ट URL का प्रारूप अमान्य है। (उदा: https://xyz.supabase.co)',
      latency: 0
    };
  }

  try {
    const startTime = performance.now();
    
    // Create an abort timeout of 8 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('कनेक्शन टाइमआउट (8s) - सर्वर से उत्तर नहीं मिला')), 8000)
    );

    // Ping the actual schema table
    const queryPromise = client
      .from('households')
      .select('id', { count: 'exact', head: true })
      .limit(0);

    const { error, status } = await Promise.race([queryPromise, timeoutPromise]);
    const latency = Math.round(performance.now() - startTime);

    if (error) {
      if (error.code === '42P01' || error.message?.toLowerCase().includes('relation') || error.message?.toLowerCase().includes('does not exist')) {
        return {
          connected: false,
          code: 'SCHEMA_MISSING',
          statusText: 'स्कीमा अनुपस्थित',
          message: `डेटाबेस कनेक्टेड है (${latency}ms) पर 'households' टेबल नहीं मिली! कृपया Supabase SQL Editor में supabase_schema.sql चलाएँ।`,
          latency
        };
      }

      if (status === 401 || status === 403 || error.message?.toLowerCase().includes('jwt') || error.message?.toLowerCase().includes('apikey')) {
        return {
          connected: false,
          code: 'AUTH_ERROR',
          statusText: 'गलत API Key',
          message: `सत्यापन विफल (HTTP ${status})! कृपया Project Settings > API से सही anon/public key कॉपी करें।`,
          latency
        };
      }

      return {
        connected: false,
        code: 'DB_ERROR',
        statusText: `त्रुटि ${status || ''}`,
        message: `डेटाबेस त्रुटि: ${error.message || 'अज्ञात त्रुटि'}`,
        latency
      };
    }

    return {
      connected: true,
      code: 'CONNECTED',
      statusText: 'लाइव कनेक्टेड',
      message: `डेटाबेस से सीधा संपर्क स्थापित (${latency}ms)। Households व Members टेबल्स सक्रिय हैं।`,
      latency
    };

  } catch (err) {
    return {
      connected: false,
      code: 'NETWORK_TIMEOUT',
      statusText: 'नेटवर्क टाइमआउट',
      message: err.message || 'डेटाबेस सर्वर तक अनुरोध नहीं पहुँच सका। कृपया नेटवर्क और URL जांचें।',
      latency: 0
    };
  }
};

/**
 * 1. PUSH: Uploads pending local records to remote Supabase
 */
export const pushPendingLocalData = async (supabase) => {
  const pendingHouseholds = await db.households.where('sync_status').equals('pending').toArray();
  let syncedHhCount = 0;
  let syncedMemCount = 0;
  const errors = [];

  for (const hh of pendingHouseholds) {
    const hhPayload = {
      local_id: hh.local_id,
      enumerator_id: hh.enumerator_id || 'ENUM-001',
      state_name: hh.state_name || 'उत्तर प्रदेश',
      district_name: hh.district_name || 'मथुरा',
      tehsil_block: hh.tehsil_block || 'मथुरा',
      ward_village_name: hh.ward_village_name || 'अज्ञात ग्राम',
      enumeration_block_no: hh.enumeration_block_no || '001',
      village_section: String(hh.village_section || '1'),
      building_no: String(hh.building_no || '001'),
      census_house_no: String(hh.census_house_no || '001'),
      household_no: String(hh.household_no || '001'),
      household_type: Number(hh.household_type) || 1,
      total_members: Number(hh.total_members) || 1,
      head_name: hh.head_name || '',
      status: hh.status || 'completed',
      remarks: hh.remarks || ''
    };

    const { data: remoteHh, error: hhError } = await supabase
      .from('households')
      .upsert(hhPayload, { onConflict: 'local_id' })
      .select('id')
      .single();

    if (hhError) {
      console.error('परिवार अपलोड त्रुटि:', hhError);
      errors.push(`परिवार #${hh.household_no}: ${hhError.message}`);
      continue;
    }

    const supabaseHouseholdId = remoteHh.id;
    await db.households.update(hh.local_id, {
      sync_status: 'synced',
      supabase_id: supabaseHouseholdId
    });
    syncedHhCount++;

    // Sync members belonging to this household
    const pendingMembers = await db.members
      .where('household_local_id')
      .equals(hh.local_id)
      .toArray();

    for (const m of pendingMembers) {
      const memberLocalId = m.local_id || `mem_${hh.local_id}_${m.serial_no}_${Math.random().toString(36).substring(2, 6)}`;
      const memberPayload = {
        local_id: memberLocalId,
        household_id: supabaseHouseholdId,
        serial_no: Number(m.serial_no),
        q1_name: m.q1_name || 'अज्ञात',
        q2_relationship: Number(m.q2_relationship) || 1,
        q3_gender: Number(m.q3_gender) || 1,
        q4a_dob: m.q4a_dob || null,
        q4b_age: Number(m.q4b_age) || 0,
        q5_marital_status: Number(m.q5_marital_status) || 1,
        q6_age_at_marriage: m.q6_age_at_marriage ? Number(m.q6_age_at_marriage) : null,
        q7_spouse_serial_no: m.q7_spouse_serial_no ? String(m.q7_spouse_serial_no) : null,
        q8_nationality: m.q8_nationality || 'भारत',
        q9_religion: Number(m.q9_religion) || 1,
        q9_religion_other: m.q9_religion_other || null,
        q10a_sc_st: Number(m.q10a_sc_st) || 3,
        q10b_caste_code: m.q10b_caste_code || null,
        q10c_caste_name: m.q10c_caste_name || null,
        q11_father_in_hh: !!m.q11_father_in_hh,
        q11_father_serial_no: m.q11_father_serial_no ? Number(m.q11_father_serial_no) : null,
        q11_father_name: m.q11_father_name || null,
        q11_father_dob: m.q11_father_dob || null,
        q11_father_birthplace: m.q11_father_birthplace || null,
        q11_father_alive: m.q11_father_alive !== undefined ? !!m.q11_father_alive : null,
        q11_father_religion: m.q11_father_religion ? Number(m.q11_father_religion) : null,
        q12_mother_in_hh: !!m.q12_mother_in_hh,
        q12_mother_serial_no: m.q12_mother_serial_no ? Number(m.q12_mother_serial_no) : null,
        q12_mother_name: m.q12_mother_name || null,
        q12_mother_dob: m.q12_mother_dob || null,
        q12_mother_birthplace: m.q12_mother_birthplace || null,
        q12_mother_alive: m.q12_mother_alive !== undefined ? !!m.q12_mother_alive : null,
        q12_mother_religion: m.q12_mother_religion ? Number(m.q12_mother_religion) : null,
        q13a_disabled: Number(m.q13a_disabled) || 2,
        q13b_disability_types: Array.isArray(m.q13b_disability_types) ? m.q13b_disability_types.map(Number) : [],
        q14a_mother_tongue: m.q14a_mother_tongue || 'हिन्दी',
        q14b_other_languages: Array.isArray(m.q14b_other_languages) ? m.q14b_other_languages : (m.q14b_other_lang1 ? [m.q14b_other_lang1, m.q14c_other_lang2].filter(Boolean) : []),
        q15a_literacy: m.q15a_literacy ? Number(m.q15a_literacy) : null,
        q15b_digital_literate: m.q15b_digital_literate ? Number(m.q15b_digital_literate) : null,
        q16_education_status: m.q16_education_status ? Number(m.q16_education_status) : null,
        q17a_highest_education: m.q17a_highest_education !== undefined ? Number(m.q17a_highest_education) : null,
        q17b_subject: m.q17b_subject ? Number(m.q17b_subject) : null,
        q18_work_last_year: m.q18_work_last_year ? Number(m.q18_work_last_year) : 4,
        q19_economic_activity: m.q19_economic_activity ? Number(m.q19_economic_activity) : null,
        q20_occupation: m.q20_occupation || null,
        q21_industry: m.q21_industry || null,
        q22_worker_class: m.q22_worker_class ? Number(m.q22_worker_class) : null,
        q23_non_economic_activity: m.q23_non_economic_activity ? Number(m.q23_non_economic_activity) : null,
        q24_seeking_work: m.q24_seeking_work ? Number(m.q24_seeking_work) : null,
        q25a_travel_distance_km: m.q25a_travel_distance_km ? Number(m.q25a_travel_distance_km) : null,
        q25b_travel_time_min: m.q25b_travel_time_min ? Number(m.q25b_travel_time_min) : null,
        q25c_travel_mode: m.q25c_travel_mode !== undefined ? Number(m.q25c_travel_mode) : null,
        q26_birth_place_type: m.q26_birth_place_type || 'here',
        q27_last_residence_type: m.q27_last_residence_type || 'here',
        q27b_rural_urban: m.q27b_rural_urban ? Number(m.q27b_rural_urban) : 1,
        q28_migration_reason: m.q28_migration_reason ? Number(m.q28_migration_reason) : null,
        q29_residence_duration_years: m.q29_residence_duration_years ? Number(m.q29_residence_duration_years) : null,
        q30_permanent_address_same: !!m.q30_permanent_address_same,
        q30_permanent_address: m.q30_permanent_address || null,
        q31_children_ever_born_female: Number(m.q31_children_ever_born_female) || 0,
        q31_children_ever_born_male: Number(m.q31_children_ever_born_male) || 0,
        q32_children_surviving_female: Number(m.q32_children_surviving_female) || 0,
        q32_children_surviving_male: Number(m.q32_children_surviving_male) || 0,
        q33_children_born_last_year_female: Number(m.q33_children_born_last_year_female) || 0,
        q33_children_born_last_year_male: Number(m.q33_children_born_last_year_male) || 0,
        q34a_covid_vaccinated: m.q34a_covid_vaccinated ? Number(m.q34a_covid_vaccinated) : null,
        q34b_covid_vaccine_place: m.q34b_covid_vaccine_place || null,
        q35_bank_accounts_count: Number(m.q35_bank_accounts_count) || 1,
        q36_mobile_number: m.q36_mobile_number || null,
        q37_aadhaar_number: m.q37_aadhaar_number || null,
        q38_voter_id_epic: m.q38_voter_id_epic || null,
        q39_passport_number: m.q39_passport_number || null,
        q40_driving_license: m.q40_driving_license ? Number(m.q40_driving_license) : null
      };

      const { error: mError } = await supabase
        .from('members')
        .upsert(memberPayload, { onConflict: 'local_id' });

      if (mError) {
        console.error('सदस्य अपलोड त्रुटि:', mError);
        errors.push(`सदस्य ${m.q1_name}: ${mError.message}`);
      } else {
        await db.members.update(memberLocalId, { sync_status: 'synced', local_id: memberLocalId });
        syncedMemCount++;
      }
    }
  }

  return { syncedHhCount, syncedMemCount, errors };
};

/**
 * 2. PULL: Downloads remote households and members from Supabase into local Dexie IndexedDB
 */
export const pullRemoteData = async (supabase) => {
  // 1. Fetch all remote households from Supabase
  const { data: remoteHhs, error: hhErr } = await supabase
    .from('households')
    .select('*')
    .order('created_at', { ascending: false });

  if (hhErr) {
    console.error('Remote households fetch error:', hhErr);
    throw new Error('परिवार डाउनलोड त्रुटि: ' + hhErr.message);
  }

  // 2. Fetch all remote members from Supabase
  const { data: remoteMems, error: memErr } = await supabase
    .from('members')
    .select('*')
    .order('serial_no', { ascending: true });

  if (memErr) {
    console.error('Remote members fetch error:', memErr);
    throw new Error('सदस्य डाउनलोड त्रुटि: ' + memErr.message);
  }

  let downloadedHhCount = 0;
  let downloadedMemCount = 0;

  // Build Supabase ID -> local_id mapping
  const supabaseIdToLocalId = {};

  for (const rh of (remoteHhs || [])) {
    const localId = rh.local_id || rh.id;
    supabaseIdToLocalId[rh.id] = localId;

    const existing = await db.households.get(localId);
    // Only update if existing record is already synced or does not exist locally
    if (!existing || existing.sync_status === 'synced') {
      await db.households.put({
        ...rh,
        local_id: localId,
        village_section: String(rh.village_section || '1'),
        sync_status: 'synced',
        supabase_id: rh.id
      });
      if (!existing) downloadedHhCount++;
    }
  }

  for (const rm of (remoteMems || [])) {
    const memLocalId = rm.local_id || rm.id;
    const parentLocalId = supabaseIdToLocalId[rm.household_id] || rm.household_id;

    const existing = await db.members.get(memLocalId);
    if (!existing || existing.sync_status === 'synced') {
      await db.members.put({
        ...rm,
        local_id: memLocalId,
        household_local_id: parentLocalId,
        sync_status: 'synced'
      });
      if (!existing) downloadedMemCount++;
    }
  }

  return {
    totalRemoteHhs: (remoteHhs || []).length,
    totalRemoteMems: (remoteMems || []).length,
    downloadedHhCount,
    downloadedMemCount
  };
};

/**
 * Helper to extract sections from a Supabase row
 */
export const extractSectionsFromRow = (rs, fallbackSections = []) => {
  if (!rs) return fallbackSections;
  let extracted = null;
  let cleanVillageCode = rs.village_code || '';

  // 1. Try dedicated sections column
  if (rs.sections) {
    try {
      extracted = typeof rs.sections === 'string' ? JSON.parse(rs.sections) : rs.sections;
    } catch (e) {
      console.warn('Dedicated sections parse error:', e);
    }
  }

  // 2. Try encoded sections inside village_code
  if (cleanVillageCode.includes(':::SECTIONS:::')) {
    const parts = cleanVillageCode.split(':::SECTIONS:::');
    cleanVillageCode = parts[0].trim();
    if ((!extracted || !Array.isArray(extracted) || extracted.length === 0) && parts[1]) {
      try {
        extracted = JSON.parse(parts[1]);
      } catch (e) {
        console.warn('Encoded sections parse error:', e);
      }
    }
  }

  const finalSections = (extracted && Array.isArray(extracted) && extracted.length > 0)
    ? extracted
    : fallbackSections;

  return { sections: finalSections, cleanVillageCode };
};

/**
 * 3. SMART BIDIRECTIONAL SETTINGS & SECTIONS SYNC
 * Compares timestamps and custom section configurations between local and cloud.
 * Guarantees that neither laptop nor mobile can wipe out the other's custom sections.
 */
export const syncSettingsBidirectional = async (supabase) => {
  try {
    const local = (await db.settings.get('active_settings')) || {};
    const { data: remoteSettings, error: sErr } = await supabase
      .from('enumerator_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (sErr) {
      console.warn('रिमोट सेटिंग्स डाउनलोड त्रुटि:', sErr.message);
      return { success: false, error: sErr.message };
    }

    const defaultSections = [
      { id: '1', name: 'सेक्शन 1' },
      { id: '2', name: 'सेक्शन 2' },
      { id: '3', name: 'सेक्शन 3' }
    ];

    const isCustomSections = (secs) => {
      if (!Array.isArray(secs) || secs.length === 0) return false;
      if (secs.length !== 3) return true;
      return secs.some((s, idx) => s.name !== `सेक्शन ${idx + 1}` && s.name !== `Section ${idx + 1}`);
    };

    const hasRemote = remoteSettings && remoteSettings.length > 0;
    const rs = hasRemote ? remoteSettings[0] : null;

    const { sections: remoteSections, cleanVillageCode } = extractSectionsFromRow(rs, defaultSections);
    const localSections = (local.sections && Array.isArray(local.sections) && local.sections.length > 0)
      ? local.sections
      : defaultSections;

    const remoteUpdatedAt = rs?.updated_at ? new Date(rs.updated_at).getTime() : 0;
    const localUpdatedAt = local?.updated_at ? new Date(local.updated_at).getTime() : 0;

    const remoteHasCustom = isCustomSections(remoteSections);
    const localHasCustom = isCustomSections(localSections);

    // Conflict Resolution: Decide who takes priority
    let remoteWins = false;
    if (hasRemote) {
      if (remoteUpdatedAt > localUpdatedAt) {
        remoteWins = true;
      } else if (remoteHasCustom && !localHasCustom) {
        remoteWins = true;
      }
    }

    // Merge sections to ensure no section created on either device is lost
    const mergedMap = new Map();
    const primary = remoteWins ? remoteSections : localSections;
    const secondary = remoteWins ? localSections : remoteSections;

    (primary || []).forEach((s) => {
      if (s && s.id) mergedMap.set(String(s.id), s);
    });
    (secondary || []).forEach((s) => {
      if (s && s.id && !mergedMap.has(String(s.id))) {
        mergedMap.set(String(s.id), s);
      }
    });

    const finalSections = Array.from(mergedMap.values());
    if (finalSections.length === 0) {
      finalSections.push(...defaultSections);
    }

    if (hasRemote && remoteWins) {
      // PULL: Remote is newer or contains customized sections while local only had defaults
      const mergedLocal = {
        ...local,
        id: 'active_settings',
        enumerator_id: rs.enumerator_id || local.enumerator_id || 'ENUM-001',
        enumerator_name: rs.enumerator_name || local.enumerator_name || 'प्रगणक',
        state_name: rs.state_name || local.state_name,
        district_name: rs.district_name || local.district_name,
        tehsil_block: rs.tehsil_block || local.tehsil_block,
        ward_village_name: rs.ward_village_name || local.ward_village_name || '',
        village_code: cleanVillageCode || local.village_code || '',
        enumeration_block_no: rs.enumeration_block_no || local.enumeration_block_no || '001',
        active_section: rs.active_section || local.active_section || '1',
        sections: finalSections,
        last_building_no: rs.last_building_no || local.last_building_no || '001',
        last_census_house_no: rs.last_census_house_no || local.last_census_house_no || '001',
        last_household_no: rs.last_household_no || local.last_household_no || '001',
        supabase_setting_id: rs.id,
        updated_at: rs.updated_at || new Date().toISOString()
      };

      await db.settings.put(mergedLocal);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('census_settings_updated', { detail: mergedLocal }));
      }

      return { success: true, updated: true, direction: 'pull', settings: mergedLocal };
    } else {
      // PUSH: Local is newer or remote does not exist
      const rawVillageCode = String(local.village_code || '').split(':::SECTIONS:::')[0].trim();
      const encodedVillageCode = `${rawVillageCode}:::SECTIONS:::${JSON.stringify(finalSections)}`;

      const payload = {
        enumerator_id: local.enumerator_id || 'ENUM-001',
        enumerator_name: local.enumerator_name || 'प्रगणक',
        state_name: local.state_name || 'उत्तर प्रदेश (Uttar Pradesh)',
        district_name: local.district_name || 'मथुरा (Mathura)',
        tehsil_block: local.tehsil_block || 'मथुरा (Mathura)',
        ward_village_name: local.ward_village_name || '',
        village_code: encodedVillageCode,
        enumeration_block_no: local.enumeration_block_no || '001',
        active_section: String(local.active_section || '1'),
        last_building_no: String(local.last_building_no || '001'),
        last_census_house_no: String(local.last_census_house_no || '001'),
        last_household_no: String(local.last_household_no || '001'),
        updated_at: local.updated_at || new Date().toISOString()
      };

      const payloadWithDedicatedSections = { ...payload, sections: finalSections };

      if (hasRemote) {
        let { error: updateErr } = await supabase
          .from('enumerator_settings')
          .update(payloadWithDedicatedSections)
          .eq('id', rs.id);

        if (updateErr) {
          const fallback = await supabase
            .from('enumerator_settings')
            .update(payload)
            .eq('id', rs.id);
          updateErr = fallback.error;
        }

        if (updateErr) {
          console.warn('लोकेशन सेटिंग्स अपडेट विफलता:', updateErr.message);
          return { success: false, error: updateErr.message };
        }
      } else {
        let { error: insertErr } = await supabase
          .from('enumerator_settings')
          .insert([payloadWithDedicatedSections]);

        if (insertErr) {
          const fallback = await supabase
            .from('enumerator_settings')
            .insert([payload]);
          insertErr = fallback.error;
        }

        if (insertErr) {
          console.warn('लोकेशन सेटिंग्स प्रविष्टि विफलता:', insertErr.message);
          return { success: false, error: insertErr.message };
        }
      }

      const updatedLocal = { ...local, sections: finalSections };
      await db.settings.put(updatedLocal);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('census_settings_updated', { detail: updatedLocal }));
      }

      return { success: true, updated: true, direction: 'push', settings: updatedLocal };
    }
  } catch (err) {
    console.error('द्विमार्गी सेटिंग्स सिंक विफलता:', err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Legacy wrappers for push/pull
 */
export const pushSettingsToCloud = async (supabase) => {
  return syncSettingsBidirectional(supabase);
};

export const pullSettingsFromCloud = async (supabase) => {
  return syncSettingsBidirectional(supabase);
};

/**
 * 5. FULL TWO-WAY COMPLETE SYNC (Households, Members & Settings across devices)
 */
export const syncPendingData = async () => {
  if (!navigator.onLine) {
    return { success: false, message: 'इंटरनेट कनेक्शन अनुपलब्ध है (ऑफ़लाइन मोड)' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'कृपया सेटिंग्स (⚙️) में प्रोजेक्ट URL व Anon Key प्रविष्ट करें' };
  }

  try {
    // 1. Smart bidirectional settings & sections sync (reconciles timestamps, prevents overwrite, merges sections)
    const settingsSync = await syncSettingsBidirectional(supabase);

    // 2. Push local pending households and members to cloud
    const { syncedHhCount, syncedMemCount, errors: pushErrors } = await pushPendingLocalData(supabase);

    // 3. Pull remote households and members from cloud into local IndexedDB
    const { totalRemoteHhs, totalRemoteMems, downloadedHhCount, downloadedMemCount } = await pullRemoteData(supabase);

    if (pushErrors && pushErrors.length > 0) {
      return {
        success: false,
        message: `आंशिक त्रुटि: ${pushErrors[0]} (${syncedHhCount} अपलोड, ${downloadedHhCount} डाउनलोड)`
      };
    }

    let msg = '';
    if (syncedHhCount > 0 || downloadedHhCount > 0) {
      msg = `समन्वय सफल: ${syncedHhCount} परिवार अपलोड, ${downloadedHhCount} डाउनलोड (कुल ${totalRemoteHhs} परिवार व प्रभाग सेटिंग्स सुरक्षित)`;
    } else {
      msg = `संपूर्ण डेटा समन्वित है: ${totalRemoteHhs} परिवार, ${totalRemoteMems} सदस्य व प्रभाग सेटिंग्स क्लाउड पर सुरक्षित`;
    }

    return {
      success: true,
      syncedHhCount,
      downloadedHhCount,
      totalRemoteHhs,
      totalRemoteMems,
      settingsUpdated: settingsSync.updated,
      updatedSettings: settingsSync.settings,
      message: msg
    };
  } catch (err) {
    console.error('द्विमार्गी समन्वय विफलता:', err);
    return { success: false, message: 'समन्वय त्रुटि: ' + (err.message || err) };
  }
};
