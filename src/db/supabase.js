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
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
};

export const getSupabaseClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (err) {
    console.error('डेटाबेस कनेक्शन त्रुटि:', err);
    return null;
  }
};

/**
 * Pushes pending local IndexedDB records to remote Supabase database
 */
export const syncPendingData = async () => {
  if (!navigator.onLine) {
    return { success: false, message: 'इंटरनेट कनेक्शन अनुपलब्ध है (ऑफ़लाइन मोड)' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'कृपया सेटिंग्स में Anon / Public Key प्रविष्ट करें' };
  }

  try {
    const pendingHouseholds = await db.households.where('sync_status').equals('pending').toArray();
    let syncedHhCount = 0;
    let syncedMemCount = 0;

    for (const hh of pendingHouseholds) {
      const hhPayload = {
        local_id: hh.local_id,
        enumerator_id: hh.enumerator_id || 'ENUM-001',
        state_name: hh.state_name,
        district_name: hh.district_name,
        tehsil_block: hh.tehsil_block,
        ward_village_name: hh.ward_village_name,
        enumeration_block_no: hh.enumeration_block_no,
        village_section: hh.village_section,
        building_no: hh.building_no,
        census_house_no: hh.census_house_no,
        household_no: hh.household_no,
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
        console.error('परिवार सिंक त्रुटि:', hhError);
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
        const memberPayload = {
          local_id: m.local_id,
          household_id: supabaseHouseholdId,
          serial_no: Number(m.serial_no),
          q1_name: m.q1_name,
          q2_relationship: Number(m.q2_relationship),
          q3_gender: Number(m.q3_gender),
          q4a_dob: m.q4a_dob || null,
          q4b_age: Number(m.q4b_age) || 0,
          q5_marital_status: Number(m.q5_marital_status) || 1,
          q6_age_at_marriage: m.q6_age_at_marriage ? Number(m.q6_age_at_marriage) : null,
          q7_spouse_serial_no: m.q7_spouse_serial_no || null,
          q8_nationality: m.q8_nationality || 'भारत',
          q9_religion: Number(m.q9_religion) || 1,
          q9_religion_other: m.q9_religion_other || null,
          q10a_sc_st: Number(m.q10a_sc_st) || 3,
          q10b_caste_code: m.q10b_caste_code || null,
          q10c_caste_name: m.q10c_caste_name || null,
          q11_father_in_hh: !!m.q11_father_in_hh,
          q11_father_serial_no: m.q11_father_serial_no ? Number(m.q11_father_serial_no) : null,
          q11_father_name: m.q11_father_name || null,
          q12_mother_in_hh: !!m.q12_mother_in_hh,
          q12_mother_serial_no: m.q12_mother_serial_no ? Number(m.q12_mother_serial_no) : null,
          q12_mother_name: m.q12_mother_name || null,
          q13a_disabled: Number(m.q13a_disabled) || 2,
          q13b_disability_types: m.q13b_disability_types || [],
          q14a_mother_tongue: m.q14a_mother_tongue || 'हिन्दी',
          q14b_other_languages: m.q14b_other_languages || [],
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

        if (!mError) {
          await db.members.update(m.local_id, { sync_status: 'synced' });
          syncedMemCount++;
        }
      }
    }

    return {
      success: true,
      message: `डेटाबेस समन्वय पूर्ण (${syncedHhCount} परिवार, ${syncedMemCount} सदस्य प्रविष्टियां)`
    };
  } catch (err) {
    console.error('समन्वय विफलता:', err);
    return { success: false, message: 'समन्वय त्रुटि: ' + (err.message || err) };
  }
};
