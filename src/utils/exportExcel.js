import { db } from '../db/db';
import {
  RELATIONSHIP_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
  RELIGION_CODES,
  DISABILITY_CODES,
  EDUCATION_STATUS_CODES,
  EDUCATION_LEVEL_CODES,
  WORK_LAST_YEAR_CODES,
  ECONOMIC_ACTIVITY_CODES,
  WORKER_CLASS_CODES,
  NON_ECONOMIC_ACTIVITY_CODES,
  COMMUTE_MODE_CODES,
  MIGRATION_REASON_CODES
} from '../constants/censusCodes';

const getLabel = (codes, value) => {
  if (value === undefined || value === null) return '';
  const item = codes.find(c => c.code === Number(value));
  return item ? item.label : value;
};

export const exportAllDataToExcel = async () => {
  const households = await db.households.toArray();
  const members = await db.members.toArray();
  const settings = await db.settings.get('active_settings');
  const sections = settings?.sections || [];

  const getSecName = (secVal) => {
    if (!secVal) return '';
    const match = sections.find((s) => s.id === String(secVal) || s.name === String(secVal));
    if (match) return match.name;
    return String(secVal).startsWith('सेक्शन') ? String(secVal) : `सेक्शन ${secVal}`;
  };

  if (households.length === 0) {
    alert('डाउनलोड करने के लिए कोई डेटा उपलब्ध नहीं है!');
    return;
  }

  // Dynamically import xlsx on demand to keep initial bundle ultra fast
  const XLSX = await import('xlsx');

  // 1. Households Sheet Data
  const hhRows = households.map((h, idx) => ({
    'क्र.सं.': idx + 1,
    'गांव का सेक्शन': getSecName(h.village_section),
    'भवन संख्या': h.building_no,
    'जनगणना मकान सं.': h.census_house_no,
    'परिवार संख्या': h.household_no,
    'मुखिया का नाम': h.head_name || '',
    'कुल सदस्य': h.total_members,
    'स्व-गणना आईडी (SE ID)': h.se_id || '—',
    'स्व-गणना स्थिति': h.is_self_enumerated ? 'स्व-गणना' : 'सामान्य गणना',
    'परिवार का प्रकार': h.household_type === 1 ? 'सामान्य' : h.household_type === 2 ? 'संस्थागत' : 'बेघर',
    'राज्य': h.state_name,
    'जिला': h.district_name,
    'तहसील/ब्लॉक': h.tehsil_block,
    'गांव/वार्ड': h.ward_village_name,
    'गणना ब्लॉक सं.': h.enumeration_block_no,
    'सिंक स्थिति': h.sync_status === 'synced' ? 'सिंक हुआ' : 'पेंडिंग (ऑफ़लाइन)',
    'दर्ज करने का समय': new Date(h.created_at).toLocaleString('hi-IN')
  }));

  // 2. Members Sheet Data (All Q.1 to Q.40)
  const memberRows = members.map((m, idx) => {
    const parentHh = households.find(h => h.local_id === m.household_local_id);

    return {
      'क्र.सं.': idx + 1,
      'परिवार सं.': parentHh ? parentHh.household_no : '',
      'मकान सं.': parentHh ? parentHh.census_house_no : '',
      'भवन सं.': parentHh ? parentHh.building_no : '',
      'ग्राम सेक्शन': parentHh ? getSecName(parentHh.village_section) : '',
      'Q.1 सदस्य का नाम': m.q1_name,
      'Q.2 सम्बन्ध': getLabel(RELATIONSHIP_CODES, m.q2_relationship),
      'Q.3 लिंग': m.q3_gender === 1 ? 'पुरुष' : m.q3_gender === 2 ? 'महिला' : 'अन्य',
      'Q.4(क) जन्म तिथि': m.q4a_dob || '',
      'Q.4(ख) आयु': m.q4b_age,
      'Q.5 वैवाहिक स्थिति': getLabel(MARITAL_STATUS_CODES, m.q5_marital_status),
      'Q.6 विवाह की आयु': m.q6_age_at_marriage || '',
      'Q.7 जीवनसाथी क्र.सं.': m.q7_spouse_serial_no || '',
      'Q.8 राष्ट्रीयता': m.q8_nationality || 'भारत',
      'Q.9 धर्म': getLabel(RELIGION_CODES, m.q9_religion),
      'Q.9 अन्य धर्म': m.q9_religion_other || '',
      'Q.10(क) जाति संवर्ग': m.q10a_sc_st === 1 ? 'SC' : m.q10a_sc_st === 2 ? 'ST' : 'सामान्य / अन्य',
      'Q.10(ख) जाति कोड': m.q10b_caste_code || '',
      'Q.10(ग) जाति का नाम': m.q10c_caste_name || '',
      'Q.11 पिता जीवित व क्र.सं.': m.q11_father_in_hh ? `हाँ (#${m.q11_father_serial_no})` : (m.q11_father_name || 'नहीं'),
      'Q.12 माता जीवित व क्र.सं.': m.q12_mother_in_hh ? `हाँ (#${m.q12_mother_serial_no})` : (m.q12_mother_name || 'नहीं'),
      'Q.13(क) दिव्यांगता': m.q13a_disabled === 1 ? 'हाँ' : 'नहीं',
      'Q.13(ख) दिव्यांगता प्रकार (गंभीरता क्रम)': (m.q13b_disability_types || []).map((code, idx) => {
        const found = DISABILITY_CODES.find(d => d.code === Number(code));
        return `[क्रम ${idx + 1}: ${found ? found.label : code}]`;
      }).join(' | '),
      'Q.14(क) मातृभाषा': m.q14a_mother_tongue || 'हिन्दी',
      'Q.14(ख) अन्य भाषाएं': m.q14b_other_languages || '',
      'Q.15(क) साक्षरता': m.q15a_literacy === 1 ? 'साक्षर' : 'निरक्षर',
      'Q.15(ख) डिजिटल साक्षर': m.q15b_digital_literate === 1 ? 'हाँ' : 'नहीं',
      'Q.16 शिक्षा स्थिति': getLabel(EDUCATION_STATUS_CODES, m.q16_education_status),
      'Q.17(क) उच्चतम शिक्षा': getLabel(EDUCATION_LEVEL_CODES, m.q17a_highest_education),
      'Q.17(ख) विषय': m.q17b_subject || '',
      'Q.18 गत वर्ष कार्य': getLabel(WORK_LAST_YEAR_CODES, m.q18_work_last_year),
      'Q.19 आर्थिक गतिविधि': Number(m.q18_work_last_year) <= 3 ? getLabel(ECONOMIC_ACTIVITY_CODES, m.q19_economic_activity) : 'लागू नहीं (गैर-कर्मी)',
      'Q.20 व्यवसाय': (Number(m.q18_work_last_year) <= 3 && Number(m.q19_economic_activity) >= 3) ? (m.q20_occupation || '') : 'लागू नहीं',
      'Q.21 उद्योग/प्रतिष्ठान': (Number(m.q18_work_last_year) <= 3 && Number(m.q19_economic_activity) >= 3) ? (m.q21_industry || '') : 'लागू नहीं',
      'Q.22 कर्मी संवर्ग': (Number(m.q18_work_last_year) <= 3 && Number(m.q19_economic_activity) >= 3) ? getLabel(WORKER_CLASS_CODES, m.q22_worker_class) : 'लागू नहीं',
      'Q.23 गैर-आर्थिक गतिविधि': Number(m.q18_work_last_year) >= 2 ? getLabel(NON_ECONOMIC_ACTIVITY_CODES, m.q23_non_economic_activity) : 'लागू नहीं (दीर्घकालिक कर्मी)',
      'Q.24 काम की तलाश': Number(m.q18_work_last_year) >= 2 ? (m.q24_seeking_work === 1 ? '1 - पूर्णकालिक' : m.q24_seeking_work === 2 ? '2 - अंशकालिक' : '3 - नहीं') : 'लागू नहीं',
      'Q.25(क) कार्यस्थल दूरी (किमी)': Number(m.q18_work_last_year) <= 3 ? (m.q25a_travel_distance_km || '') : 'लागू नहीं',
      'Q.25(ख) यात्रा समय (मिनट)': Number(m.q18_work_last_year) <= 3 ? (m.q25b_travel_time_min || '') : 'लागू नहीं',
      'Q.25(ग) यात्रा साधन': Number(m.q18_work_last_year) <= 3 ? getLabel(COMMUTE_MODE_CODES, m.q25c_travel_mode) : 'लागू नहीं',
      'Q.26 जन्म स्थान': m.q26_birth_place_type === 'here' ? 'गणना स्थल पर' : (m.q26_birth_state || 'अन्य'),
      'Q.27 पूर्व निवास स्थान': m.q27_last_residence_type === 'here' ? 'जन्म से यहीं' : (m.q27_last_residence_state || m.q27_last_residence_details || 'अन्य'),
      'Q.27(ख) पूर्व निवास क्षेत्र': m.q27_last_residence_type === 'here' ? 'लागू नहीं' : (m.q27b_rural_urban === 2 ? '2 - शहरी' : '1 - ग्रामीण'),
      'Q.28 प्रवास कारण': getLabel(MIGRATION_REASON_CODES, m.q28_migration_reason),
      'Q.29 निवास अवधि (वर्ष)': m.q29_residence_duration_years || '',
      'Q.30 स्थायी पता समान': m.q30_permanent_address_same ? 'हाँ' : (m.q30_permanent_address || 'अन्य'),
      'Q.31 वर्तमान जीवित संतानें (पुत्री/पुत्र)': `${m.q32_children_surviving_female || 0} पुत्री / ${m.q32_children_surviving_male || 0} पुत्र`,
      'Q.32 कभी जीवित जन्मी कुल संतानें (पुत्री/पुत्र)': `${m.q31_children_ever_born_female || 0} पुत्री / ${m.q31_children_ever_born_male || 0} पुत्र`,
      'Q.33 गत 1 वर्ष में जन्मी संतानें (पुत्री/पुत्र)': `${m.q33_children_born_last_year_female || 0} पुत्री / ${m.q33_children_born_last_year_male || 0} पुत्र`,
      'Q.34(क) कोविड टीका': m.q34a_covid_vaccinated === 1 ? '1 - हाँ' : '2 - नहीं',
      'Q.34(ख) टीका स्थल': m.q34b_covid_vaccine_place || '',
      'Q.35 बैंक खाता संख्या': m.q35_bank_accounts_count || 1,
      'Q.36 मोबाइल नंबर': m.q36_mobile_number || '',
      'Q.37 आधार नंबर': m.q37_aadhaar_number || '',
      'Q.38 मतदाता परिचय पत्र (EPIC)': m.q38_voter_id_epic || '',
      'Q.39 पासपोर्ट नंबर': m.q39_passport_number || '',
      'Q.40 ड्राइविंग लाइसेंस': m.q40_driving_license === 1 ? 'हाँ' : 'नहीं'
    };
  });

  const wb = XLSX.utils.book_new();
  const wsHouseholds = XLSX.utils.json_to_sheet(hhRows);
  const wsMembers = XLSX.utils.json_to_sheet(memberRows);

  XLSX.utils.book_append_sheet(wb, wsHouseholds, 'परिवार सूची (Households)');
  XLSX.utils.book_append_sheet(wb, wsMembers, 'सदस्य प्रपत्र Q1-Q40 (Members)');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `जनगणना_परिवार_प्रपत्र_${dateStr}.xlsx`);
};
