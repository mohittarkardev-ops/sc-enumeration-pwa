import * as XLSX from 'xlsx';
import { db } from '../db/db';
import {
  RELATIONSHIP_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
  RELIGION_CODES,
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

  if (households.length === 0) {
    alert('डाउनलोड करने के लिए कोई डेटा उपलब्ध नहीं है!');
    return;
  }

  // 1. Households Sheet Data
  const hhRows = households.map((h, idx) => ({
    'क्र.सं.': idx + 1,
    'गांव का सेक्शन': `सेक्शन ${h.village_section}`,
    'भवन संख्या': h.building_no,
    'जनगणना मकान सं.': h.census_house_no,
    'परिवार संख्या': h.household_no,
    'मुखिया का नाम': h.head_name || '',
    'कुल सदस्य': h.total_members,
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
    // Find parent household
    const parentHh = households.find(h => h.local_id === m.household_local_id);

    return {
      'क्र.सं.': idx + 1,
      'परिवार सं.': parentHh ? parentHh.household_no : '',
      'मकान सं.': parentHh ? parentHh.census_house_no : '',
      'सेक्शन': parentHh ? `सेक्शन ${parentHh.village_section}` : '',
      'सदस्य क्र.सं.': m.serial_no,
      'Q.1 व्यक्ति का नाम': m.q1_name,
      'Q.2 मुखिया से सम्बन्ध': getLabel(RELATIONSHIP_CODES, m.q2_relationship),
      'Q.3 लिंग': getLabel(GENDER_CODES, m.q3_gender),
      'Q.4(क) जन्म तिथि': m.q4a_dob || '',
      'Q.4(ख) आयु (वर्ष)': m.q4b_age,
      'Q.5 वैवाहिक स्थिति': getLabel(MARITAL_STATUS_CODES, m.q5_marital_status),
      'Q.6 विवाह के समय आयु': m.q6_age_at_marriage || '',
      'Q.7 पति/पत्नी क्र.सं.': m.q7_spouse_serial_no || '',
      'Q.8 राष्ट्रीयता': m.q8_nationality || 'भारत',
      'Q.9 धर्म': getLabel(RELATIONSHIP_CODES, m.q9_religion) || (m.q9_religion === 7 ? `अन्य (${m.q9_religion_other})` : getLabel(RELIGION_CODES, m.q9_religion)),
      'Q.10(क) अ.जा./अ.ज.जा.': m.q10a_sc_st === 1 ? 'अनुसूचित जाति (SC)' : m.q10a_sc_st === 2 ? 'अनुसूचित जनजाति (ST)' : 'अन्य/सामान्य',
      'Q.10(ख) SC/ST कोड': m.q10b_caste_code || '',
      'Q.10(ग) जाति का नाम': m.q10c_caste_name || '',
      'Q.11 पिता का नाम / क्र.सं.': m.q11_father_in_hh ? `परिवार में क्र. ${m.q11_father_serial_no}` : (m.q11_father_name || ''),
      'Q.12 माता का नाम / क्र.सं.': m.q12_mother_in_hh ? `परिवार में क्र. ${m.q12_mother_serial_no}` : (m.q12_mother_name || ''),
      'Q.13 दिव्यांगता': m.q13a_disabled === 1 ? 'हाँ' : 'नहीं',
      'Q.14 मातृभाषा': m.q14a_mother_tongue || 'हिन्दी',
      'Q.15(क) साक्षरता': m.q15a_literacy === 1 ? 'साक्षर' : m.q15a_literacy === 2 ? 'निरक्षर' : '',
      'Q.15(ख) डिजिटल साक्षर': m.q15b_digital_literate === 1 ? 'हाँ' : m.q15b_digital_literate === 2 ? 'नहीं' : '',
      'Q.16 शिक्षा स्थिति': getLabel(EDUCATION_STATUS_CODES, m.q16_education_status),
      'Q.17(क) उच्चतम शिक्षा स्तर': getLabel(EDUCATION_LEVEL_CODES, m.q17a_highest_education),
      'Q.18 पिछला कार्य': getLabel(WORK_LAST_YEAR_CODES, m.q18_work_last_year),
      'Q.19 आर्थिक गतिविधि': getLabel(ECONOMIC_ACTIVITY_CODES, m.q19_economic_activity),
      'Q.20 व्यवसाय': m.q20_occupation || '',
      'Q.21 उद्योग/व्यापार': m.q21_industry || '',
      'Q.22 कर्मी का वर्ग': getLabel(WORKER_CLASS_CODES, m.q22_worker_class),
      'Q.23 गैर-आर्थिक गतिविधि': getLabel(NON_ECONOMIC_ACTIVITY_CODES, m.q23_non_economic_activity),
      'Q.25 यात्रा का साधन': getLabel(COMMUTE_MODE_CODES, m.q25c_travel_mode),
      'Q.28 प्रवास का कारण': getLabel(MIGRATION_REASON_CODES, m.q28_migration_reason),
      'Q.30 स्थायी पता': m.q30_permanent_address_same ? 'मुखिया के समान' : (m.q30_permanent_address || ''),
      'Q.31 जीवित संतानें (स्त्री)': m.q31_children_ever_born_female || 0,
      'Q.31 जीवित संतानें (पुरुष)': m.q31_children_ever_born_male || 0,
      'Q.34 कोविड टीका': m.q34a_covid_vaccinated === 1 ? 'हाँ' : 'नहीं',
      'Q.35 बैंक खाते संख्या': m.q35_bank_accounts_count || 1,
      'Q.36 मोबाइल नंबर': m.q36_mobile_number || '',
      'Q.37 आधार नंबर': m.q37_aadhaar_number || '',
      'Q.38 वोटर आईडी (EPIC)': m.q38_voter_id_epic || '',
      'Q.39 पासपोर्ट': m.q39_passport_number || '',
      'Q.40 ड्राइविंग लाइसेंस': m.q40_driving_license === 1 ? 'हाँ' : m.q40_driving_license === 2 ? 'नहीं' : ''
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
