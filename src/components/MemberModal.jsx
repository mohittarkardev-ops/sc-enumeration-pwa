import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Info,
  Lock,
  Sparkles,
  CheckCircle2,
  Calendar,
  QrCode
} from 'lucide-react';
import AadhaarQRScanner from './AadhaarQRScanner';
import AadhaarDigitInput from './AadhaarDigitInput';
import { 
  sanitizeName, 
  sanitizeNumeric, 
  sanitizeText, 
  sanitizeAlphanumeric, 
  validateMemberRecord,
  validatePassportNumber,
  formatDobInput,
  parseAndValidateDob
} from '../utils/validation';
import {
  RELATIONSHIP_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
  RELIGION_CODES,
  SOCIAL_CATEGORY_CODES,
  DISABILITY_CODES,
  EDUCATION_STATUS_CODES,
  EDUCATION_LEVEL_CODES,
  EDUCATION_SUBJECT_CODES,
  WORK_LAST_YEAR_CODES,
  ECONOMIC_ACTIVITY_CODES,
  WORKER_CLASS_CODES,
  NON_ECONOMIC_ACTIVITY_CODES,
  COMMUTE_MODE_CODES,
  MIGRATION_REASON_CODES
} from '../constants/censusCodes';
import { INDIAN_STATES } from '../constants/indiaLocations';
import { getPotentialFathers, getPotentialMothers } from '../utils/familyTreeResolver';


export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  serialNo,
  existingMember = null,
  headMember = null,
  householdMembers = []
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState({});

  const [isAgeLocked, setIsAgeLocked] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedLast4, setScannedLast4] = useState('');

  const initialData = {
    local_id: existingMember?.local_id || ('mem_temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
    serial_no: serialNo,
    q1_name: '',
    q2_relationship: serialNo === 1 ? 1 : 2,
    q3_gender: 1,
    q4a_dob: '',
    q4b_age: '',
    q5_marital_status: 1,
    q6_age_at_marriage: '',
    q7_spouse_serial_no: '',
    q8_nationality: 'भारत',
    q9_religion: 1,
    q9_religion_other: '',
    q10a_sc: 2,
    q10b_st: 2,
    q10a_sc_st: 3,
    q10b_caste_code: '',
    q10c_caste_name: '',
    q11_father_in_hh: false,
    q11_father_serial_no: '',
    q11_father_name: '',
    q11_father_alive: true,
    q11_father_dob: '',
    q11_father_birthplace: '',
    q11_father_religion: 1,
    q12_mother_in_hh: false,
    q12_mother_serial_no: '',
    q12_mother_name: '',
    q12_mother_alive: true,
    q12_mother_dob: '',
    q12_mother_birthplace: '',
    q12_mother_religion: 1,
    q13a_disabled: 2,
    q13b_disability_types: [],
    q14a_mother_tongue: 'हिन्दी',
    q14b_other_languages: '',
    q14b_other_lang1: '',
    q14c_other_lang2: '',
    q15a_literacy: 1,
    q15b_digital_literate: 1,
    q16_education_status: 1,
    q17a_highest_education: 10,
    q17b_subject: '',
    q18_work_last_year: 4,
    q19_economic_activity: 1,
    q20_occupation: '',
    q21_industry: '',
    q22_worker_class: 3,
    q23_non_economic_activity: 2,
    q24_seeking_work: 3,
    q25a_travel_distance_km: '',
    q25b_travel_time_min: '',
    q25c_travel_mode: 0,
    q26_birth_place_type: 'here',
    q26_birth_state: 'उत्तर प्रदेश (Uttar Pradesh)',
    q26_birth_place_details: '',
    q27_last_residence_type: 'here',
    q27_last_residence_state: 'उत्तर प्रदेश (Uttar Pradesh)',
    q27_last_residence_details: '',
    q27b_rural_urban: 1,
    q28_migration_reason: '',
    q29_residence_duration_years: '',
    q30_permanent_address_same: true,
    q30_permanent_address: '',
    q31_children_ever_born_female: 0,
    q31_children_ever_born_male: 0,
    q32_children_surviving_female: 0,
    q32_children_surviving_male: 0,
    q33_children_born_last_year_female: 0,
    q33_children_born_last_year_male: 0,
    q34a_covid_vaccinated: 1,
    q35_bank_accounts_count: 1,
    q36_mobile_number: '',
    q37_aadhaar_number: '',
    q38_voter_id_epic: '',
    q39_passport_number: '',
    q40_driving_license: 2
  };

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
      setErrors({});
      setScannedLast4('');
      if (existingMember) {
        const merged = { ...initialData, ...existingMember };
        // Determine SC/ST radio state
        merged.q10a_sc = existingMember.q10a_sc || (existingMember.q10a_sc_st === 1 ? 1 : 2);
        merged.q10b_st = existingMember.q10b_st || (existingMember.q10a_sc_st === 2 ? 1 : 2);
        
        // Check if DOB is present and valid to lock age
        if (merged.q4a_dob && merged.q4a_dob.trim() !== '') {
          const dobRes = parseAndValidateDob(merged.q4a_dob);
          setIsAgeLocked(dobRes.isValid && dobRes.calculatedAge !== null);
        } else {
          setIsAgeLocked(false);
        }
        setFormData(merged);
      } else {
        const newData = { ...initialData, serial_no: serialNo };
        // Smart prefill for Member #2: ONLY if Head is actually married (status 2) and no spouse exists yet
        const headIsMarried = headMember && Number(headMember.q5_marital_status) === 2;
        const spouseAlreadyExists = householdMembers.some(m => Number(m.q2_relationship) === 2);

        if (serialNo === 2 && headIsMarried && !spouseAlreadyExists) {
          newData.q2_relationship = 2; // पति या पत्नी
          newData.q3_gender = headMember.q3_gender === 1 ? 2 : 1; // विपरीत लिंग
          newData.q5_marital_status = 2; // विवाहित
          newData.q7_spouse_serial_no = '1'; // मुखिया से स्वतः लिंक
        } else if (serialNo > 1) {
          newData.q2_relationship = 3; // बेटा/बेटी
          newData.q3_gender = 1;
          newData.q5_marital_status = 1; // अविवाहित
          newData.q7_spouse_serial_no = '';
        }
        if (serialNo > 1 && headMember) {
          newData.q9_religion = headMember.q9_religion || 1;
          newData.q9_religion_other = headMember.q9_religion_other || '';
          newData.q10a_sc_st = headMember.q10a_sc_st || 3;
          newData.q10a_sc = headMember.q10a_sc || (headMember.q10a_sc_st === 1 ? 1 : 2);
          newData.q10b_st = headMember.q10b_st || (headMember.q10a_sc_st === 2 ? 1 : 2);
          newData.q10b_caste_code = headMember.q10b_caste_code || '';
          newData.q10c_caste_name = headMember.q10c_caste_name || '';
          newData.q14a_mother_tongue = headMember.q14a_mother_tongue || 'हिन्दी';
          newData.q30_permanent_address_same = true;
          newData.q30_permanent_address = headMember.q30_permanent_address || '';
        }
        setIsAgeLocked(false);
        setFormData(newData);
      }
    }
  }, [isOpen, serialNo, existingMember, headMember]);

  if (!isOpen) return null;

  const age = Number(formData.q4b_age) || 0;
  const isFemale = Number(formData.q3_gender) === 2;
  const isMarriedOrEver = Number(formData.q5_marital_status) >= 2;
  const isWorker = Number(formData.q18_work_last_year) <= 3;
  const isClass11Plus = Number(formData.q17a_highest_education) >= 11;

  const potentialFathers = getPotentialFathers(formData, householdMembers);
  const potentialMothers = getPotentialMothers(formData, householdMembers);
  const potentialSpouses = householdMembers.filter(m => m.serial_no !== formData.serial_no);

  const handleNameChange = (val) => {
    const clean = sanitizeName(val);
    setFormData((prev) => ({ ...prev, q1_name: clean }));
    if (errors.q1_name) setErrors((prev) => ({ ...prev, q1_name: undefined }));
  };

  const handleRelationshipChange = (code) => {
    const relCode = Number(code);
    setFormData((prev) => {
      const updated = { ...prev, q2_relationship: relCode };
      // Smart Auto-fill: If relationship is Spouse (02) and member is not Head
      if (relCode === 2 && prev.serial_no > 1) {
        updated.q5_marital_status = 2; // विवाहित
        updated.q7_spouse_serial_no = '1'; // मुखिया
        if (headMember) {
          updated.q3_gender = headMember.q3_gender === 1 ? 2 : 1;
        }
      }
      return updated;
    });
    if (errors.q2_relationship) setErrors((prev) => ({ ...prev, q2_relationship: undefined }));
  };

  const handleAgeChange = (val) => {
    if (isAgeLocked) return; // Prevent manual change when calculated from valid DOB
    const clean = sanitizeNumeric(val);
    const num = clean === '' ? '' : Math.min(125, parseInt(clean, 10));
    setFormData((prev) => ({ ...prev, q4b_age: num }));
    if (errors.q4b_age) setErrors((prev) => ({ ...prev, q4b_age: undefined }));
  };

  // Fast Numeric Keypad DOB input handler with auto-formatting DD/MM/YYYY and automatic Age lock
  const handleNumericDobInput = (rawVal) => {
    const formatted = formatDobInput(rawVal);
    
    if (formatted.length === 10) {
      const res = parseAndValidateDob(formatted);
      if (res.isValid && res.calculatedAge !== null) {
        setFormData((prev) => ({
          ...prev,
          q4a_dob: res.formattedDob,
          q4b_age: res.calculatedAge
        }));
        setIsAgeLocked(true);
        if (errors.q4a_dob || errors.q4b_age) {
          setErrors((prev) => ({ ...prev, q4a_dob: undefined, q4b_age: undefined }));
        }
      } else {
        setFormData((prev) => ({ ...prev, q4a_dob: formatted }));
        setErrors((prev) => ({ ...prev, q4a_dob: res.message }));
        setIsAgeLocked(false);
      }
    } else if (formatted.trim() === '') {
      // DOB erased: Unlock age for direct manual entry
      setFormData((prev) => ({ ...prev, q4a_dob: '' }));
      setIsAgeLocked(false);
      if (errors.q4a_dob) setErrors((prev) => ({ ...prev, q4a_dob: undefined }));
    } else {
      setFormData((prev) => ({ ...prev, q4a_dob: formatted }));
      setIsAgeLocked(false);
    }
  };

  // Aadhaar QR scan result handler
  const handleScanSuccess = (parsed) => {
    if (!parsed) return;
    setFormData((prev) => {
      const updated = { ...prev };
      if (parsed.name) updated.q1_name = parsed.name;
      if (parsed.gender) updated.q3_gender = parsed.gender;
      if (parsed.dob) {
        updated.q4a_dob = parsed.dob;
        if (parsed.age !== null && parsed.age !== undefined) {
          updated.q4b_age = parsed.age;
          setIsAgeLocked(true);
        }
      } else if (parsed.age !== null && parsed.age !== undefined) {
        updated.q4b_age = parsed.age;
      }
      if (parsed.aadhaarNumber && parsed.aadhaarNumber.length === 12 && !parsed.aadhaarNumber.includes('X')) {
        updated.q37_aadhaar_number = parsed.aadhaarNumber;
      }
      if (parsed.address) {
        updated.q30_permanent_address = parsed.address;
        updated.q30_permanent_address_same = false;
      }
      return updated;
    });
    if (parsed.last4) {
      setScannedLast4(parsed.last4);
    }
    setErrors((prev) => ({
      ...prev,
      q1_name: undefined,
      q4b_age: undefined,
      q3_gender: undefined
    }));
  };

  const handleMobileChange = (val) => {
    const clean = sanitizeNumeric(val).slice(0, 10);
    setFormData((prev) => ({ ...prev, q36_mobile_number: clean }));
    if (errors.q36_mobile_number) setErrors((prev) => ({ ...prev, q36_mobile_number: undefined }));
  };

  const handleAadhaarChange = (val) => {
    if (val.trim() === 'नहीं' || val.trim() === 'उपलब्ध नहीं') {
      setFormData((prev) => ({ ...prev, q37_aadhaar_number: val }));
      return;
    }
    const clean = sanitizeNumeric(val).slice(0, 12);
    setFormData((prev) => ({ ...prev, q37_aadhaar_number: clean }));
    if (errors.q37_aadhaar_number) setErrors((prev) => ({ ...prev, q37_aadhaar_number: undefined }));
  };

  const handleVoterIdChange = (val) => {
    const clean = sanitizeAlphanumeric(val).slice(0, 16);
    setFormData((prev) => ({ ...prev, q38_voter_id_epic: clean }));
    if (errors.q38_voter_id_epic) setErrors((prev) => ({ ...prev, q38_voter_id_epic: undefined }));
  };

  const handlePassportChange = (val) => {
    const clean = sanitizeAlphanumeric(val).toUpperCase().slice(0, 8);
    setFormData((prev) => ({ ...prev, q39_passport_number: clean }));
    if (errors.q39_passport_number) setErrors((prev) => ({ ...prev, q39_passport_number: undefined }));
  };

  const handleDisabilityTypeToggle = (code) => {
    const current = formData.q13b_disability_types || [];
    const index = current.indexOf(code);
    if (index !== -1) {
      // Remove it
      setFormData((prev) => ({
        ...prev,
        q13b_disability_types: current.filter((c) => c !== code)
      }));
    } else {
      if (current.length >= 3) {
        alert('आधिकारिक नियमावली अनुसार अधिकतम 3 दिव्यांगता प्रकार चुने जा सकते हैं! क्रम बदलने हेतु ◀ / ▶ या ▲ / ▼ तीरों का उपयोग करें।');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        q13b_disability_types: [...current, code]
      }));
    }
  };

  const moveDisabilitySeverity = (index, direction) => {
    const current = [...(formData.q13b_disability_types || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;
    setFormData((prev) => ({
      ...prev,
      q13b_disability_types: current
    }));
  };

  const handleCopyFromHead = () => {
    if (!headMember) return;
    setFormData((prev) => ({
      ...prev,
      q9_religion: headMember.q9_religion || 1,
      q9_religion_other: headMember.q9_religion_other || '',
      q10a_sc_st: headMember.q10a_sc_st || 3,
      q10b_caste_code: headMember.q10b_caste_code || '',
      q10c_caste_name: headMember.q10c_caste_name || '',
      q14a_mother_tongue: headMember.q14a_mother_tongue || 'हिन्दी',
      q30_permanent_address_same: true,
      q30_permanent_address: headMember.q30_permanent_address || ''
    }));
  };

  const handleSaveMember = (e) => {
    e.preventDefault();

    const validation = validateMemberRecord(formData, householdMembers, formData.serial_no === 1 ? 0 : 1);
    if (!validation.isValid) {
      setErrors(validation.errors);

      if (validation.errors.q1_name || validation.errors.q2_relationship || validation.errors.q3_gender || validation.errors.q4b_age || validation.errors.q6_age_at_marriage) {
        setActiveTab(0);
      } else if (validation.errors.q10a_sc_st || validation.errors.q11_father_serial_no || validation.errors.q12_mother_serial_no) {
        setActiveTab(1);
      } else if (validation.errors.q31_children_ever_born || validation.errors.q32_children_surviving || validation.errors.q33_children_born_last_year) {
        setActiveTab(tabs.findIndex(t => t.id === 'fertility'));
      } else if (validation.errors.q36_mobile_number || validation.errors.q37_aadhaar_number || validation.errors.q38_voter_id_epic || validation.errors.q39_passport_number) {
        setActiveTab(tabs.length - 1);
      }
      return;
    }

    onSave(formData);
  };

  const tabs = [
    { id: 'demo', title: 'खंड I: जनसांख्यिकी' },
    { id: 'social', title: 'खंड II: सामाजिक व माता-पिता' },
    { id: 'edu', title: 'खंड III: साक्षरता व शिक्षा' },
    { id: 'work', title: 'खंड IV: कार्य व गतिविधि' },
    { id: 'residence', title: 'खंड V: जन्म व प्रवास' },
    ...(isFemale && isMarriedOrEver ? [{ id: 'fertility', title: 'खंड VI: प्रजनन विवरण' }] : []),
    { id: 'ids', title: 'खंड VII: पहचान व बैंक' }
  ];

  const progressPercent = Math.round(((activeTab + 1) / tabs.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-none sm:rounded-2xl w-full max-w-xl h-full sm:h-[94vh] shadow-2xl flex flex-col border-0 sm:border border-slate-200 overflow-hidden">
        
        {/* Official Header with Refined Padding */}
        <div className="bg-[#0B3B60] text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-[#072F5F]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-xs shadow-sm">
              #{formData.serial_no}
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight">
                {formData.serial_no === 1 ? 'परिवार के मुखिया का प्रपत्र' : `परिवार के सदस्य का प्रपत्र (${formData.serial_no})`}
              </h2>
              <div className="text-[11px] text-slate-200">
                {formData.q1_name ? `नाम: ${formData.q1_name}` : 'व्यक्तिगत विवरणी प्रविष्टि'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formData.serial_no > 1 && headMember && (
              <button
                type="button"
                onClick={handleCopyFromHead}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#134D7E] hover:bg-[#1A5B94] rounded-lg text-[11px] font-semibold text-amber-300 border border-white/20 active:scale-95 transition-all shadow-sm"
                title="धर्म, जाति व स्थायी पता मुखिया से प्रतिलिपि करें"
              >
                <Copy className="w-3 h-3" />
                <span>मुखिया से कॉपी</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar (Step Indicator) */}
        <div className="bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between px-4 py-1 text-xs sm:text-sm font-bold text-slate-700">
            <span>{tabs[activeTab]?.title}</span>
            <span className="text-[#0B3B60] font-mono">{activeTab + 1} / {tabs.length} ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-200 h-1">
            <div 
              className="bg-[#0B3B60] h-1 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Tab Strip */}
          <div className="flex overflow-x-auto no-scrollbar px-2 py-1 gap-1">
            {tabs.map((t, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body - Soft Rounded Cards */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 text-sm space-y-4 bg-slate-50 momentum-scroll scroll-smooth">
          
                    {/* TAB 0: जनसांख्यिकी (प्र. 1 से 9) */}
          {activeTab === 0 && (
            <div className="space-y-4">

              {/* Aadhaar QR Scanner Fast Action Banner */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 p-3 rounded-2xl border border-blue-200 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-[#0B3B60] text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                    <QrCode className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B3B60] leading-tight">आधार कार्ड QR स्कैनर</p>
                    <p className="text-[11px] text-slate-600">नाम, लिंग, जन्म तिथि, आयु व पता स्वतः भरें</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#0B3B60] hover:bg-[#072F5F] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span>📷 QR स्कैन करें</span>
                </button>
              </div>

              {/* Q.1 व्यक्ति का नाम */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 1 व्यक्ति का नाम <span className="text-red-600 font-bold">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">
                    (श्री / श्रीमती / सुश्री न लिखें)
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.q1_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="व्यक्ति का वास्तविक नाम दर्ज करें"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                    errors.q1_name ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
                  }`}
                  autoFocus
                />
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>आधिकारिक निर्देश: व्यक्ति का पूरा नाम बिना किसी उपाधि या उपनाम के लिखें।</span>
                </p>
                {errors.q1_name && (
                  <p className="text-xs sm:text-sm font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.q1_name}</span>
                  </p>
                )}
              </div>

              {/* Q.2 मुखिया से सम्बन्ध */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 2 परिवार के मुखिया से सम्बन्ध (कोड 01-32) <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q2_relationship}
                    onChange={(e) => handleRelationshipChange(e.target.value)}
                    disabled={formData.serial_no === 1}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {RELATIONSHIP_CODES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                {errors.q2_relationship && (
                  <p className="text-xs sm:text-sm font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.q2_relationship}</span>
                  </p>
                )}
              </div>

              {/* Q.3 लिंग */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 3 लिंग <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_CODES.map((g) => (
                    <button
                      key={g.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, q3_gender: g.code })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border transition-all ${
                        formData.q3_gender === g.code
                          ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q.4 जन्म तिथि और आयु - FAST NUMERIC KEYBOARD + AUTO AGE LOCK */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  
                  {/* 4(क) Fast Numeric DOB Input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      प्र. 4(क) जन्म तिथि (DD/MM/YYYY)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.q4a_dob || ''}
                        onChange={(e) => handleNumericDobInput(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm sm:text-base font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                          errors.q4a_dob ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      संख्यात्मक कीबोर्ड से 8 अंक (दिन/माह/वर्ष) लिखें
                    </span>
                  </div>

                  {/* 4(ख) आयु - Read-only when calculated from DOB */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs sm:text-sm font-bold text-slate-900">
                        प्र. 4(ख) आयु (पूर्ण वर्ष) <span className="text-red-600 font-bold">*</span>
                      </label>
                      {isAgeLocked && (
                        <span className="text-[11px] text-[#0B3B60] font-extrabold flex items-center gap-0.5">
                          <Lock className="w-3 h-3 text-[#0B3B60]" />
                          लॉक्ड
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q4b_age}
                      readOnly={isAgeLocked}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      placeholder={isAgeLocked ? 'DOB से परिकलित' : 'पूर्ण आयु (उदा. 35)'}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm sm:text-base font-black ${
                        isAgeLocked
                          ? 'bg-blue-50 text-[#0B3B60] border-blue-300 cursor-not-allowed shadow-inner'
                          : errors.q4b_age ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]'
                      }`}
                    />
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {isAgeLocked ? 'DOB से स्वतः परिकलित • बदलने हेतु DOB हटाएं' : '1 वर्ष से कम शिशु हेतु 0 लिखें'}
                    </span>
                  </div>

                </div>

                {errors.q4a_dob && (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q4a_dob}</span>
                  </p>
                )}

                {errors.q4b_age && (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q4b_age}</span>
                  </p>
                )}
              </div>

              {/* Q.37 आधार संख्या (Aadhaar Number - 12 अंक त्वरित प्रविष्टि) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 37 आधार संख्या (Aadhaar Number - 12 अंक)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      q37_aadhaar_number: prev.q37_aadhaar_number === 'नहीं' ? '' : 'नहीं'
                    }))}
                    className="text-xs text-[#0B3B60] font-bold underline hover:text-blue-900"
                  >
                    {formData.q37_aadhaar_number === 'नहीं' ? '+ आधार नंबर दर्ज करें' : 'आधार उपलब्ध नहीं'}
                  </button>
                </div>

                <AadhaarDigitInput
                  value={formData.q37_aadhaar_number || ''}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, q37_aadhaar_number: val }));
                    if (errors.q37_aadhaar_number) setErrors((prev) => ({ ...prev, q37_aadhaar_number: undefined }));
                  }}
                  scannedLast4={scannedLast4}
                  error={errors.q37_aadhaar_number}
                />
              </div>

              {/* Q.5 वैवाहिक स्थिति */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 5 वर्तमान वैवाहिक स्थिति <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q5_marital_status}
                    onChange={(e) => {
                      const newStatus = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        q5_marital_status: newStatus,
                        q7_spouse_serial_no: newStatus === 2 ? prev.q7_spouse_serial_no : ''
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {MARITAL_STATUS_CODES.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Q.6 & Q.7: SMART SPOUSE & MARRIAGE LOGIC */}
              {isMarriedOrEver && (
                <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
                  <div className="text-xs sm:text-sm font-bold text-amber-950 border-b border-amber-200/80 pb-1.5 flex items-center justify-between">
                    <span>विवाहित / कभी विवाहित सदस्यों हेतु विवरण (प्र. 6 एवं प्र. 7):</span>
                    <span className="text-[11px] bg-amber-100 px-2 py-0.5 rounded font-mono">Q.6 - Q.7</span>
                  </div>

                  <div className="space-y-3">
                    {/* Q.6 विवाह के समय आयु */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        प्र. 6 विवाह के समय आयु (पूर्ण वर्षों में) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.q6_age_at_marriage}
                        onChange={(e) => setFormData({ ...formData, q6_age_at_marriage: sanitizeNumeric(e.target.value) })}
                        placeholder="विवाह के समय आयु (उदा. 21)"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm sm:text-base bg-white font-bold ${
                          errors.q6_age_at_marriage ? 'border-red-500 bg-red-50' : 'border-slate-300'
                        }`}
                      />
                      {errors.q6_age_at_marriage && (
                        <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.q6_age_at_marriage}</span>
                        </p>
                      )}
                    </div>

                    {/* Q.7 पति / पत्नी का परिवार में क्रम संख्या (SMART IMPLEMENTATION) */}
                    {Number(formData.q5_marital_status) === 2 ? (
                      <div>
                        {formData.serial_no === 1 && potentialSpouses.length === 0 ? (
                          /* Condition: Member #1 (Head) is married and spouse is not entered yet */
                          <div className="bg-white p-3 rounded-xl border border-amber-300/80 space-y-2">
                            <label className="block text-xs sm:text-sm font-bold text-[#0B3B60]">
                              प्र. 7 मुखिया के पति/पत्नी का परिवार में क्र.सं.
                            </label>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, q7_spouse_serial_no: '' })}
                                className={`p-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-left flex items-start gap-2 ${
                                  formData.q7_spouse_serial_no === ''
                                    ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <div>इसी परिवार में हैं</div>
                                  <div className="text-[10px] opacity-85 font-normal">जीवनसाथी (02) जोड़ने पर स्वतः लिंक होगा</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, q7_spouse_serial_no: '00' })}
                                className={`p-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-left flex items-start gap-2 ${
                                  formData.q7_spouse_serial_no === '00'
                                    ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <div>परिवार से बाहर / अन्यत्र</div>
                                  <div className="text-[10px] opacity-85 font-normal">कोड 00 (बाहर)</div>
                                </div>
                              </button>
                            </div>

                            {formData.q7_spouse_serial_no !== '00' && (
                              <p className="text-xs text-blue-900 font-semibold flex items-center gap-1.5 pt-0.5">
                                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>सुविधा: जब आप परिवार में पति/पत्नी (कोड 02) जोड़ेंगे, तो क्र.सं. 1 और जीवनसाथी स्वतः आपस में लिंक हो जाएंगे।</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Condition: Spouse candidate exists in household */
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                                प्र. 7 पति/पत्नी का परिवार में क्र.सं. <span className="text-red-600">*</span>
                              </label>
                              {formData.serial_no > 1 && formData.q2_relationship === 2 && (
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  मुखिया से लिंक
                                </span>
                              )}
                            </div>

                            <div className="relative">
                              <select
                                value={formData.q7_spouse_serial_no || ''}
                                onChange={(e) => setFormData({ ...formData, q7_spouse_serial_no: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold appearance-none pr-8 focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                              >
                                <option value="">-- जीवनसाथी का चयन करें --</option>
                                {potentialSpouses.map((s) => (
                                  <option key={s.serial_no} value={s.serial_no}>
                                    क्र. {s.serial_no} - {s.q1_name} ({s.q3_gender === 1 ? 'पुरुष' : s.q3_gender === 2 ? 'महिला' : 'अन्य'}, {s.q4b_age} वर्ष)
                                  </option>
                                ))}
                                <option value="00">00 - परिवार से बाहर / अन्यत्र निवास</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
                        प्र. 7 लागू नहीं (वर्तमान में विवाहित नहीं हैं)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Q.8 & Q.9 धर्म */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 9 धर्म <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q9_religion}
                    onChange={(e) => setFormData({ ...formData, q9_religion: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {RELIGION_CODES.map((rel) => (
                      <option key={rel.code} value={rel.code}>
                        {rel.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                {formData.q9_religion === 7 && (
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      अन्य धर्म का नाम लिखें
                    </label>
                    <input
                      type="text"
                      value={formData.q9_religion_other}
                      onChange={(e) => setFormData({ ...formData, q9_religion_other: sanitizeText(e.target.value) })}
                      placeholder="धर्म का नाम"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: सामाजिक, माता-पिता एवं दिव्यांगता (प्र. 10 से 14 strictly matching schedule photo) */}
          {activeTab === 1 && (
            <div className="space-y-4">
              
              {/* Q.10 अनुसूचित जाति / जनजाति / जाति विवरण (Strictly Matching Official Schedule Photo) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                    प्र. 10 अनुसूचित जाति / जनजाति / जाति विवरण
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    10(क) क्या अ.जा. है? 10(ख) क्या अ.ज.जा. है? हाँ... 1, नहीं... 2
                  </p>
                </div>

                {/* 10(क) and 10(ख) Radio Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* 10(क) अनुसूचित जाति (SC) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      10(क) क्या अ.जा. (SC) हैं? <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, q10a_sc: 1, q10b_st: 2, q10a_sc_st: 1 })}
                        className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                          formData.q10a_sc === 1
                            ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        1 - हाँ
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, q10a_sc: 2, q10a_sc_st: formData.q10b_st === 1 ? 2 : 3 })}
                        className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                          formData.q10a_sc === 2
                            ? 'bg-slate-700 text-white border-slate-800'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        2 - नहीं
                      </button>
                    </div>
                  </div>

                  {/* 10(ख) अनुसूचित जनजाति (ST) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      10(ख) क्या अ.ज.जा. (ST) हैं? <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={formData.q10a_sc === 1}
                        onClick={() => setFormData({ ...formData, q10b_st: 1, q10a_sc: 2, q10a_sc_st: 2 })}
                        className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                          formData.q10b_st === 1
                            ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50'
                        }`}
                      >
                        1 - हाँ
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, q10b_st: 2, q10a_sc_st: formData.q10a_sc === 1 ? 1 : 3 })}
                        className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                          formData.q10b_st === 2
                            ? 'bg-slate-700 text-white border-slate-800'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        2 - नहीं
                      </button>
                    </div>
                  </div>

                </div>

                {/* If SC or ST: Name & 3-digit Code */}
                {(formData.q10a_sc === 1 || formData.q10b_st === 1) ? (
                  <div className="grid grid-cols-3 gap-2.5 pt-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <div className="col-span-2">
                      <label className="block text-xs sm:text-sm font-bold text-amber-950 mb-1">
                        राज्य की सूची से {formData.q10a_sc === 1 ? 'SC' : 'ST'} जाति का नाम
                      </label>
                      <input
                        type="text"
                        value={formData.q10c_caste_name || ''}
                        onChange={(e) => setFormData({ ...formData, q10c_caste_name: sanitizeText(e.target.value) })}
                        placeholder="उदा. जाटव, चमार, कोरी, थारू आदि"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-amber-950 mb-1">
                        जाति कोड [3 अंक]
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={formData.q10b_caste_code || ''}
                        onChange={(e) => setFormData({ ...formData, q10b_caste_code: sanitizeNumeric(e.target.value).slice(0, 3) })}
                        placeholder="066"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-center text-sm bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  /* 10(ग) Both No: General / OBC / Other Caste Name */
                  <div className="space-y-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      10(ग) दोनों में नहीं: जाति का नाम / संवर्ग
                    </label>
                    <input
                      type="text"
                      value={formData.q10c_caste_name || ''}
                      onChange={(e) => setFormData({ ...formData, q10c_caste_name: sanitizeText(e.target.value) })}
                      placeholder="जाति का नाम लिखें (उदा. ब्राह्मण, जाट, यादव, ठाकुर, आदि)"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold"
                    />
                    
                    {/* Quick 1-Tap Chips */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-semibold">त्वरित विकल्प:</span>
                      {['नहीं बताना चाहते', 'कोई जाति नहीं', 'सामान्य (General)'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({ ...formData, q10c_caste_name: opt })}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 active:scale-95 transition-all shadow-xs"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Q.11 पिता का विवरण (Matching Schedule Photo) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                    प्र. 11 पिता का विवरण
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    इसी परिवार में गणना हुई हो तो केवल क्र.सं., अन्यथा नाम, जीवित/मृत, जन्म तिथि, जन्म स्थान व धर्म
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q11_father_in_hh: true })}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                      formData.q11_father_in_hh
                        ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    इसी परिवार में गणना हुई है
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q11_father_in_hh: false })}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                      !formData.q11_father_in_hh
                        ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    परिवार से बाहर / दिवंगत
                  </button>
                </div>

                {formData.q11_father_in_hh ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                      परिवार में पिता का चयन करें (क्र.सं.) <span className="text-red-600">*</span>
                    </label>
                    {potentialFathers.length > 0 ? (
                      <div className="relative">
                        <select
                          value={formData.q11_father_serial_no || ''}
                          onChange={(e) => setFormData({ ...formData, q11_father_serial_no: e.target.value ? Number(e.target.value) : '' })}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold appearance-none pr-8"
                        >
                          <option value="">-- पिता का चयन करें --</option>
                          {potentialFathers.map((f) => {
                            const rel = RELATIONSHIP_CODES.find((r) => r.code === Number(f.q2_relationship));
                            return (
                              <option key={f.serial_no} value={f.serial_no}>
                                क्र. {f.serial_no} - {f.q1_name} ({f.q4b_age} वर्ष, {rel ? rel.label : 'सदस्य'})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">परिवार में कोई योग्य पिता (आयु में 15+ वर्ष बड़े व नियमानुसार) उपस्थित नहीं हैं।</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              (मुखिया या भाई के पिता केवल 'माता/पिता (12)' हो सकते हैं; छोटा भाई या बेटा पिता नहीं हो सकता)।
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, q11_father_in_hh: false, q11_father_serial_no: null })}
                          className="w-full py-2 bg-[#0B3B60] hover:bg-[#072F5F] text-white rounded-lg text-xs font-bold text-center transition-all"
                        >
                          परिवार से बाहर / दिवंगत विकल्प चुनें
                        </button>
                      </div>
                    )}
                    {errors.q11_father_serial_no && (
                      <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.q11_father_serial_no}
                      </p>
                    )}
                  </div>
                ) : (
                  /* When outside family or deceased: Name, Alive/Dead, DOB, Birthplace, Religion */
                  <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                        पिता का पूरा नाम <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.q11_father_name || ''}
                        onChange={(e) => setFormData({ ...formData, q11_father_name: sanitizeName(e.target.value) })}
                        placeholder="पिता का नाम दर्ज करें"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          क्या पिता जीवित हैं?
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, q11_father_alive: true })}
                            className={`py-2 rounded-xl text-xs font-bold border ${
                              formData.q11_father_alive === true
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            1-जीवित
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, q11_father_alive: false })}
                            className={`py-2 rounded-xl text-xs font-bold border ${
                              formData.q11_father_alive === false
                                ? 'bg-slate-700 text-white border-slate-800'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            2-दिवंगत
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          पिता की जन्म तिथि (DD/MM/YYYY)
                          {formData.q11_father_alive === false && <span className="text-[10px] text-slate-500 font-normal ml-1">(ऐच्छिक)</span>}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={formData.q11_father_dob || ''}
                          onChange={(e) => setFormData({ ...formData, q11_father_dob: formatDobInput(e.target.value) })}
                          placeholder="DD/MM/YYYY"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono bg-white"
                        />
                      </div>
                    </div>

                    {formData.q11_father_alive === false && (
                      <div className="bg-slate-100 p-2 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                        दिवंगत पिता के लिए जन्म तिथि व जन्म स्थान ज्ञात न होने पर खाली छोड़ सकते हैं।
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          जन्म स्थान (राज्य/जिला/देश)
                          {formData.q11_father_alive === false && <span className="text-[10px] text-slate-500 font-normal ml-1">(ऐच्छिक)</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.q11_father_birthplace || ''}
                          onChange={(e) => setFormData({ ...formData, q11_father_birthplace: sanitizeText(e.target.value) })}
                          placeholder="उदा. मथुरा, उ.प्र."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          पिता का धर्म
                        </label>
                        <select
                          value={formData.q11_father_religion || formData.q9_religion || 1}
                          onChange={(e) => setFormData({ ...formData, q11_father_religion: Number(e.target.value) })}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-semibold"
                        >
                          {RELIGION_CODES.map((r) => (
                            <option key={r.code} value={r.code}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q.12 माता का विवरण (Matching Schedule Photo) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                    प्र. 12 माता का विवरण
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    इसी परिवार में गणना हुई हो तो केवल क्र.सं., अन्यथा नाम, जीवित/मृत, जन्म तिथि, जन्म स्थान व धर्म
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q12_mother_in_hh: true })}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                      formData.q12_mother_in_hh
                        ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    इसी परिवार में गणना हुई है
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q12_mother_in_hh: false })}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] border transition-all ${
                      !formData.q12_mother_in_hh
                        ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    परिवार से बाहर / दिवंगत
                  </button>
                </div>

                {formData.q12_mother_in_hh ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                      परिवार में माता का चयन करें (क्र.सं.) <span className="text-red-600">*</span>
                    </label>
                    {potentialMothers.length > 0 ? (
                      <div className="relative">
                        <select
                          value={formData.q12_mother_serial_no || ''}
                          onChange={(e) => setFormData({ ...formData, q12_mother_serial_no: e.target.value ? Number(e.target.value) : '' })}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold appearance-none pr-8"
                        >
                          <option value="">-- माता का चयन करें --</option>
                          {potentialMothers.map((m) => {
                            const rel = RELATIONSHIP_CODES.find((r) => r.code === Number(m.q2_relationship));
                            return (
                              <option key={m.serial_no} value={m.serial_no}>
                                क्र. {m.serial_no} - {m.q1_name} ({m.q4b_age} वर्ष, {rel ? rel.label : 'सदस्य'})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">परिवार में कोई योग्य माता (आयु में 15+ वर्ष बड़ी व नियमानुसार) उपस्थित नहीं हैं।</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              (मुखिया या बहन की माता केवल 'माता/पिता (12)' हो सकती हैं; छोटी बहन या बेटी माता नहीं हो सकती)।
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, q12_mother_in_hh: false, q12_mother_serial_no: null })}
                          className="w-full py-2 bg-[#0B3B60] hover:bg-[#072F5F] text-white rounded-lg text-xs font-bold text-center transition-all"
                        >
                          परिवार से बाहर / दिवंगत विकल्प चुनें
                        </button>
                      </div>
                    )}
                    {errors.q12_mother_serial_no && (
                      <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.q12_mother_serial_no}
                      </p>
                    )}
                  </div>
                ) : (
                  /* When outside family or deceased: Name, Alive/Dead, DOB, Birthplace, Religion */
                  <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                        माता का पूरा नाम <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.q12_mother_name || ''}
                        onChange={(e) => setFormData({ ...formData, q12_mother_name: sanitizeName(e.target.value) })}
                        placeholder="माता का नाम दर्ज करें"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          क्या माता जीवित हैं?
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, q12_mother_alive: true })}
                            className={`py-2 rounded-xl text-xs font-bold border ${
                              formData.q12_mother_alive === true
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            1-जीवित
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, q12_mother_alive: false })}
                            className={`py-2 rounded-xl text-xs font-bold border ${
                              formData.q12_mother_alive === false
                                ? 'bg-slate-700 text-white border-slate-800'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            2-दिवंगत
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          माता की जन्म तिथि (DD/MM/YYYY)
                          {formData.q12_mother_alive === false && <span className="text-[10px] text-slate-500 font-normal ml-1">(ऐच्छिक)</span>}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={formData.q12_mother_dob || ''}
                          onChange={(e) => setFormData({ ...formData, q12_mother_dob: formatDobInput(e.target.value) })}
                          placeholder="DD/MM/YYYY"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono bg-white"
                        />
                      </div>
                    </div>

                    {formData.q12_mother_alive === false && (
                      <div className="bg-slate-100 p-2 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                        दिवंगत माता के लिए जन्म तिथि व जन्म स्थान ज्ञात न होने पर खाली छोड़ सकते हैं।
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          जन्म स्थान (राज्य/जिला/देश)
                          {formData.q12_mother_alive === false && <span className="text-[10px] text-slate-500 font-normal ml-1">(ऐच्छिक)</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.q12_mother_birthplace || ''}
                          onChange={(e) => setFormData({ ...formData, q12_mother_birthplace: sanitizeText(e.target.value) })}
                          placeholder="उदा. मथुरा, उ.प्र."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                          माता का धर्म
                        </label>
                        <select
                          value={formData.q12_mother_religion || formData.q9_religion || 1}
                          onChange={(e) => setFormData({ ...formData, q12_mother_religion: Number(e.target.value) })}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-semibold"
                        >
                          {RELIGION_CODES.map((r) => (
                            <option key={r.code} value={r.code}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q.13 दिव्यांगता (Matching Schedule Photo: 13(क) 1-हाँ, 2-नहीं; 13(ख) अधिकतम 3 प्रकार) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                    प्र. 13 दिव्यांगता विवरण
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    13(क) कोई दिव्यांगता? हाँ... 1, नहीं... 2 | 13(ख) प्रकार (अधिकतम 3, गम्भीरता के क्रम में)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q13a_disabled: 1 })}
                    className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border min-h-[40px] ${
                      formData.q13a_disabled === 1
                        ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    1 - हाँ (दिव्यांगता है)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q13a_disabled: 2, q13b_disability_types: [] })}
                    className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border min-h-[40px] ${
                      formData.q13a_disabled === 2
                        ? 'bg-slate-700 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    2 - नहीं
                  </button>
                </div>

                {formData.q13a_disabled === 1 && (
                  <div className="pt-2 space-y-3 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="block text-xs sm:text-sm font-black text-slate-800">
                        13(ख) प्रकार (अधिकतम 3 कोड, गंभीरता के क्रम में):
                      </label>
                      <span className="text-[11px] font-bold text-slate-500">
                        प्रविष्ट कोड: <strong className="text-[#0B3B60]">{(formData.q13b_disability_types || []).length} / 3</strong>
                      </span>
                    </div>

                    {/* OFFICIAL CENSUS 3-BOX PREVIEW: गंभीरता १, २, ३ */}
                    <div className="bg-white p-3 rounded-xl border-2 border-blue-200/80 shadow-xs space-y-2">
                      <div className="text-[11px] font-extrabold text-[#0B3B60] uppercase tracking-wider flex items-center justify-between">
                        <span>जनगणना प्रपत्र 13(ख) प्रविष्टि बॉक्स</span>
                        <span className="text-slate-400 font-normal font-mono">ख [ 1 ] [ 2 ] [ 3 ]</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((slotIdx) => {
                          const selectedCode = (formData.q13b_disability_types || [])[slotIdx];
                          const disObj = selectedCode ? DISABILITY_CODES.find((d) => d.code === Number(selectedCode)) : null;
                          const severityLabels = ['१. सर्वाधिक गंभीर', '२. द्वितीय गंभीर', '३. तृतीय गंभीर'];
                          const severityBadgeColors = [
                            'bg-amber-100 text-amber-900 border-amber-300 font-black',
                            'bg-blue-100 text-blue-900 border-blue-300 font-bold',
                            'bg-slate-100 text-slate-800 border-slate-300 font-bold'
                          ];

                          return (
                            <div
                              key={slotIdx}
                              className={`p-2 rounded-xl border flex flex-col justify-between transition-all min-h-[96px] ${
                                disObj
                                  ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                                  : 'bg-slate-50/60 border-dashed border-slate-300 text-slate-400'
                              }`}
                            >
                              <div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-block ${severityBadgeColors[slotIdx]}`}>
                                  {severityLabels[slotIdx]}
                                </span>
                                
                                {disObj ? (
                                  <div className="mt-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-6 h-6 rounded-md bg-[#0B3B60] text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                        {disObj.code}
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">
                                        {disObj.label.replace(/^\d+\s*-\s*/, '')}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 text-center">
                                    <span className="text-base font-mono text-slate-300 font-bold">[ — ]</span>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">रिक्त</p>
                                  </div>
                                )}
                              </div>

                              {/* Slot Re-order Controls */}
                              {disObj && (
                                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-blue-200/60">
                                  <div className="flex items-center gap-1">
                                    {slotIdx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => moveDisabilitySeverity(slotIdx, -1)}
                                        title="गंभीरता क्रम में ऊपर लाएं"
                                        className="w-6 h-5 rounded bg-white hover:bg-blue-100 text-slate-800 border border-slate-300 active:scale-95 text-xs font-black flex items-center justify-center shadow-2xs"
                                      >
                                        ◀
                                      </button>
                                    )}
                                    {slotIdx < (formData.q13b_disability_types || []).length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => moveDisabilitySeverity(slotIdx, 1)}
                                        title="गंभीरता क्रम में नीचे करें"
                                        className="w-6 h-5 rounded bg-white hover:bg-blue-100 text-slate-800 border border-slate-300 active:scale-95 text-xs font-black flex items-center justify-center shadow-2xs"
                                      >
                                        ▶
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDisabilityTypeToggle(disObj.code)}
                                    title="हटाएं"
                                    className="p-1 rounded text-red-600 hover:bg-red-50 text-[11px] font-black"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed italic">
                        💡 आधिकारिक नियम: यदि व्यक्ति में एक से अधिक दिव्यांगता है, तो जो सबसे अधिक गंभीर है उसे क्रम १ पर रखें, उसके बाद क्रम २ व ३ चुनें।
                      </p>
                    </div>

                    {/* DISABILITY CODE SELECTION GRID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        दिव्यांगता प्रकार की सूची (टैप करके चुनें या हटाएं):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DISABILITY_CODES.map((d) => {
                          const currentList = formData.q13b_disability_types || [];
                          const rankIndex = currentList.indexOf(d.code);
                          const isSelected = rankIndex !== -1;
                          const severityLabels = ['क्रम १ (सर्वाधिक)', 'क्रम २ (द्वितीय)', 'क्रम ३ (तृतीय)'];

                          return (
                            <div
                              key={d.code}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleDisabilityTypeToggle(d.code)}
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                <span
                                  className={`w-6 h-6 rounded-md font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-white text-[#0B3B60]' : 'bg-slate-100 text-slate-700 border'
                                  }`}
                                >
                                  {d.code}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold leading-tight">
                                  {d.label.replace(/^\d+\s*-\s*/, '')}
                                </span>
                              </button>

                              {isSelected && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                                    {severityLabels[rankIndex]}
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    {rankIndex > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveDisabilitySeverity(rankIndex, -1);
                                        }}
                                        title="गंभीरता ऊपर लाएं"
                                        className="w-5 h-4 bg-white/20 hover:bg-white/30 rounded text-[9px] font-black text-white flex items-center justify-center"
                                      >
                                        ▲
                                      </button>
                                    )}
                                    {rankIndex < currentList.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveDisabilitySeverity(rankIndex, 1);
                                        }}
                                        title="गंभीरता नीचे करें"
                                        className="w-5 h-4 bg-white/20 hover:bg-white/30 rounded text-[9px] font-black text-white flex items-center justify-center"
                                      >
                                        ▼
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q.14 मातृभाषा व अन्य भाषाएँ (Matching Schedule Photo: 14(क) मातृभाषा, 14(ख, ग) अन्य ज्ञात भाषाएँ) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                    प्र. 14 मातृभाषा व अन्य भाषाएँ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    14(क) मातृभाषा का पूरा नाम | 14(ख, ग) अन्य ज्ञात भाषाएँ, दक्षता के क्रम में (अधिकतम 2)
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    14(क) मातृभाषा का पूरा नाम <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.q14a_mother_tongue || 'हिन्दी'}
                    onChange={(e) => setFormData({ ...formData, q14a_mother_tongue: sanitizeName(e.target.value) })}
                    placeholder="उदा. हिन्दी, ब्रजभाषा, उर्दू आदि"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base font-bold bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      14(ख) अन्य ज्ञात भाषा 1
                    </label>
                    <input
                      type="text"
                      value={formData.q14b_other_lang1 || ''}
                      onChange={(e) => setFormData({ ...formData, q14b_other_lang1: sanitizeName(e.target.value) })}
                      placeholder="उदा. अंग्रेजी"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      14(ग) अन्य ज्ञात भाषा 2
                    </label>
                    <input
                      type="text"
                      value={formData.q14c_other_lang2 || ''}
                      onChange={(e) => setFormData({ ...formData, q14c_other_lang2: sanitizeName(e.target.value) })}
                      placeholder="उदा. संस्कृत / उर्दू"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: साक्षरता एवं शिक्षा (प्र. 15 से 17) */}
          {activeTab === 2 && (
            <div className="space-y-3.5">
              {age < 7 ? (
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center text-slate-700">
                  <p className="font-bold text-xs">आयु 7 वर्ष से कम है ({age} वर्ष)</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    जनगणना नियमावली अनुसार 7 वर्ष से कम आयु के बच्चों हेतु साक्षरता एवं शिक्षा लागू नहीं होती।
                  </p>
                </div>
              ) : (
                <>
                  {/* Q.15 साक्षरता */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      प्र. 15(क) साक्षरता की स्थिति (7 वर्ष +)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, q15a_literacy: 1 })}
                        className={`py-2 rounded-lg font-bold text-xs border ${
                          formData.q15a_literacy === 1
                            ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        1 - साक्षर
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, q15a_literacy: 2 })}
                        className={`py-2 rounded-lg font-bold text-xs border ${
                          formData.q15a_literacy === 2
                            ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        2 - निरक्षर
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        प्र. 15(ख) डिजिटल साक्षर? (मोबाइल/कंप्यूटर संचालन)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, q15b_digital_literate: 1 })}
                          className={`py-1.5 rounded-lg font-bold text-xs border ${
                            formData.q15b_digital_literate === 1
                              ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          1 - हाँ
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, q15b_digital_literate: 2 })}
                          className={`py-1.5 rounded-lg font-bold text-xs border ${
                            formData.q15b_digital_literate === 2
                              ? 'bg-slate-700 text-white border-slate-800'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          2 - नहीं
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Q.16 शिक्षा संस्थान */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      प्र. 16 शैक्षणिक संस्थान में शिक्षा की स्थिति
                    </label>
                    <div className="relative">
                      <select
                        value={formData.q16_education_status}
                        onChange={(e) => setFormData({ ...formData, q16_education_status: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                      >
                        {EDUCATION_STATUS_CODES.map((ed) => (
                          <option key={ed.code} value={ed.code}>
                            {ed.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Q.17 उच्चतम शिक्षा स्तर */}
                  {formData.q15a_literacy === 1 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2.5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                          प्र. 17(क) उच्चतम शिक्षा स्तर (उत्तीर्ण)
                        </label>
                        <div className="relative">
                          <select
                            value={formData.q17a_highest_education}
                            onChange={(e) => setFormData({ ...formData, q17a_highest_education: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                          >
                            {EDUCATION_LEVEL_CODES.map((el) => (
                              <option key={el.code} value={el.code}>
                                {el.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Q.17(ख) विषय */}
                      {isClass11Plus && (
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                            प्र. 17(ख) विषय (कक्षा 11+ हेतु)
                          </label>
                          <div className="relative">
                            <select
                              value={formData.q17b_subject}
                              onChange={(e) => setFormData({ ...formData, q17b_subject: Number(e.target.value) })}
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                            >
                              <option value="">विषय चुनें</option>
                              {EDUCATION_SUBJECT_CODES.map((sub) => (
                                <option key={sub.code} value={sub.code}>
                                  {sub.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: कार्य एवं आर्थिक गतिविधि (प्र. 18 से 25) */}
          {activeTab === 3 && (
            <div className="space-y-3.5">
              {age < 7 ? (
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center text-slate-700">
                  <p className="font-bold text-xs">आयु 7 वर्ष से कम है</p>
                  <p className="text-xs text-slate-500 mt-0.5">बच्चों पर कार्य संबंधी प्रश्न लागू नहीं हैं।</p>
                </div>
              ) : (
                <>
                  {/* Q.18 पिछला कार्य */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      प्र. 18 पिछले वर्ष कभी काम किया?
                    </label>
                    <div className="relative">
                      <select
                        value={formData.q18_work_last_year}
                        onChange={(e) => setFormData({ ...formData, q18_work_last_year: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                      >
                        {WORK_LAST_YEAR_CODES.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {isWorker ? (
                    <div className="space-y-3.5">
                      {/* Q.19 आर्थिक गतिविधि */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                        <label className="block text-xs sm:text-sm font-bold text-slate-900">
                          प्र. 19 आर्थिक गतिविधि की श्रेणी
                        </label>
                        <div className="relative">
                          <select
                            value={formData.q19_economic_activity}
                            onChange={(e) => setFormData({ ...formData, q19_economic_activity: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                          >
                            {ECONOMIC_ACTIVITY_CODES.map((ea) => (
                              <option key={ea.code} value={ea.code}>
                                {ea.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Q.20 & Q.21 */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-0.5">
                            प्र. 20 व्यवसाय (वास्तविक कार्य विवरण)
                          </label>
                          <input
                            type="text"
                            value={formData.q20_occupation}
                            onChange={(e) => setFormData({ ...formData, q20_occupation: sanitizeText(e.target.value) })}
                            placeholder="उदा. कृषि, पशुपालन, राजमिस्त्री, दुकानदार, शिक्षक"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-0.5">
                            प्र. 21 उद्योग, व्यापार या सेवा
                          </label>
                          <input
                            type="text"
                            value={formData.q21_industry}
                            onChange={(e) => setFormData({ ...formData, q21_industry: sanitizeText(e.target.value) })}
                            placeholder="उद्योग अथवा सेवा का विवरण"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                          />
                        </div>
                      </div>

                      {/* Q.22 कर्मी वर्ग */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                        <label className="block text-xs sm:text-sm font-bold text-slate-900">
                          प्र. 22 कर्मी का वर्ग
                        </label>
                        <div className="relative">
                          <select
                            value={formData.q22_worker_class}
                            onChange={(e) => setFormData({ ...formData, q22_worker_class: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                          >
                            {WORKER_CLASS_CODES.map((wc) => (
                              <option key={wc.code} value={wc.code}>
                                {wc.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      {/* Q.25 यात्रा */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                        <label className="block text-xs sm:text-sm font-bold text-slate-900">
                          प्र. 25(ग) कार्यस्थल तक यात्रा का साधन
                        </label>
                        <div className="relative">
                          <select
                            value={formData.q25c_travel_mode}
                            onChange={(e) => setFormData({ ...formData, q25c_travel_mode: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                          >
                            {COMMUTE_MODE_CODES.map((cm) => (
                              <option key={cm.code} value={cm.code}>
                                {cm.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>

                        {formData.q25c_travel_mode > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                प्र. 25(क) दूरी (किमी)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formData.q25a_travel_distance_km}
                                onChange={(e) => setFormData({ ...formData, q25a_travel_distance_km: sanitizeNumeric(e.target.value) })}
                                placeholder="किमी"
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                प्र. 25(ख) समय (मिनट)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formData.q25b_travel_time_min}
                                onChange={(e) => setFormData({ ...formData, q25b_travel_time_min: sanitizeNumeric(e.target.value) })}
                                placeholder="मिनट"
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                        <label className="block text-xs sm:text-sm font-bold text-slate-900">
                          प्र. 23 गैर-आर्थिक गतिविधि
                        </label>
                        <div className="relative">
                          <select
                            value={formData.q23_non_economic_activity}
                            onChange={(e) => setFormData({ ...formData, q23_non_economic_activity: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                          >
                            {NON_ECONOMIC_ACTIVITY_CODES.map((ne) => (
                              <option key={ne.code} value={ne.code}>
                                {ne.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                        <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                          प्र. 24 काम की तलाश अथवा उपलब्धता
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { code: 1, label: '1 - पूर्णकालिक' },
                            { code: 2, label: '2 - अंशकालिक' },
                            { code: 3, label: '3 - नहीं' }
                          ].map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => setFormData({ ...formData, q24_seeking_work: item.code })}
                              className={`py-2 rounded-lg font-bold text-xs border ${
                                formData.q24_seeking_work === item.code
                                  ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: जन्म, प्रवास एवं पता (प्र. 26 से 30) */}
          {activeTab === 4 && (
            <div className="space-y-3.5">
              {/* Q.26 जन्म स्थान */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">प्र. 26 जन्म स्थान</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { code: 'here', label: 'इसी गांव में' },
                    { code: 'india', label: 'अन्य (भारत)' },
                    { code: 'outside', label: 'विदेश' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, q26_birth_place_type: item.code })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border ${
                        formData.q26_birth_place_type === item.code
                          ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {formData.q26_birth_place_type === 'india' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        जन्म का राज्य चुनें
                      </label>
                      <div className="relative">
                        <select
                          value={formData.q26_birth_state}
                          onChange={(e) => setFormData({ ...formData, q26_birth_state: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white appearance-none pr-8 text-xs"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formData.q26_birth_place_details}
                        onChange={(e) => setFormData({ ...formData, q26_birth_place_details: sanitizeText(e.target.value) })}
                        placeholder="जिला अथवा गाँव का नाम"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Q.27 पूर्व निवास स्थान */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">प्र. 27 पूर्व निवास स्थान</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { code: 'here', label: 'जन्म से यहीं' },
                    { code: 'rural', label: 'अन्य ग्रामीण क्षेत्र' },
                    { code: 'urban', label: 'अन्य शहरी क्षेत्र' },
                    { code: 'outside', label: 'विदेश' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, q27_last_residence_type: item.code })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border ${
                        formData.q27_last_residence_type === item.code
                          ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {formData.q27_last_residence_type !== 'here' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        पूर्व निवास का राज्य
                      </label>
                      <div className="relative">
                        <select
                          value={formData.q27_last_residence_state}
                          onChange={(e) => setFormData({ ...formData, q27_last_residence_state: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white appearance-none pr-8 text-xs"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                        27(ख) पूर्व निवास के समय वह क्षेत्र था:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, q27b_rural_urban: 1 })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                            (formData.q27b_rural_urban || 1) === 1
                              ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          1 - ग्रामीण
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, q27b_rural_urban: 2 })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                            formData.q27b_rural_urban === 2
                              ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          2 - शहरी
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                        प्र. 28 स्थान परिवर्तन का कारण
                      </label>
                      <div className="relative">
                        <select
                          value={formData.q28_migration_reason}
                          onChange={(e) => setFormData({ ...formData, q28_migration_reason: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base"
                        >
                          <option value="">कारण चुनें</option>
                          {MIGRATION_REASON_CODES.map((mr) => (
                            <option key={mr.code} value={mr.code}>
                              {mr.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        प्र. 29 यहाँ रहने की अवधि (पूर्ण वर्ष)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.q29_residence_duration_years}
                        onChange={(e) => setFormData({ ...formData, q29_residence_duration_years: sanitizeNumeric(e.target.value) })}
                        placeholder="वर्ष (1 से कम = 0)"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Q.30 स्थायी निवास का पता */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">प्र. 30 स्थायी निवास का पता</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.q30_permanent_address_same}
                    onChange={(e) => setFormData({ ...formData, q30_permanent_address_same: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0B3B60] focus:ring-[#0B3B60]"
                  />
                  <span className="text-xs font-semibold text-slate-700">परिवार के मुखिया के समान पता</span>
                </label>

                {!formData.q30_permanent_address_same && (
                  <textarea
                    rows={2}
                    value={formData.q30_permanent_address}
                    onChange={(e) => setFormData({ ...formData, q30_permanent_address: sanitizeText(e.target.value) })}
                    placeholder="पूर्ण स्थायी पता दर्ज करें"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-medium"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 5: प्रजनन विवरण (प्र. 31 से 33) */}
          {isFemale && isMarriedOrEver && activeTab === (tabs.findIndex(t => t.id === 'fertility')) && (
            <div className="space-y-3.5 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-sm">
              <div className="text-xs sm:text-sm font-bold text-slate-900 border-b border-amber-300 pb-1">
                प्रजनन संबंधी विवरण (केवल कभी-विवाहित महिलाओं हेतु)
              </div>

              {/* Q.31 वर्तमान में जीवित संतानें (Matching Official Schedule Col 31) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 31 वर्तमान में जीवित संतानें (Surviving Children)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">अनुसूची स्तम्भ 31</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्री (कन्याएँ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q32_children_surviving_female}
                      onChange={(e) => setFormData({ ...formData, q32_children_surviving_female: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्र (बालक)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q32_children_surviving_male}
                      onChange={(e) => setFormData({ ...formData, q32_children_surviving_male: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                </div>
                {errors.q32_children_surviving && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.q32_children_surviving}</p>
                )}
              </div>

              {/* Q.32 कभी जीवित जन्मी कुल संतानें (Matching Official Schedule Col 32) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 32 कभी जीवित जन्मी कुल संतानें (Children Ever Born Alive)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">अनुसूची स्तम्भ 32</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्री (कन्याएँ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q31_children_ever_born_female}
                      onChange={(e) => setFormData({ ...formData, q31_children_ever_born_female: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्र (बालक)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q31_children_ever_born_male}
                      onChange={(e) => setFormData({ ...formData, q31_children_ever_born_male: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Q.33 पिछले 1 वर्ष में जन्मी संतानें (Matching Official Schedule Col 33) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 33 पिछले 1 वर्ष में जीवित जन्मी संतानें
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">अनुसूची स्तम्भ 33</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्री</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q33_children_born_last_year_female}
                      onChange={(e) => setFormData({ ...formData, q33_children_born_last_year_female: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्र</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q33_children_born_last_year_male}
                      onChange={(e) => setFormData({ ...formData, q33_children_born_last_year_male: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                </div>
                {errors.q33_children_born_last_year && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.q33_children_born_last_year}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: पहचान पत्र व बैंक (प्र. 34 से 40) */}
          {activeTab === tabs.length - 1 && (
            <div className="space-y-3.5">
              {/* Q.34 कोविड टीका & Q.35 बैंक खाता */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    प्र. 34 कोविड-19 टीका
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, q34a_covid_vaccinated: 1 })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border ${
                        formData.q34a_covid_vaccinated === 1
                          ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      1-हाँ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, q34a_covid_vaccinated: 2 })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border ${
                        formData.q34a_covid_vaccinated === 2
                          ? 'bg-slate-700 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      2-नहीं
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    प्र. 35 बैंक खाते (संख्या)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.q35_bank_accounts_count}
                    onChange={(e) => setFormData({ ...formData, q35_bank_accounts_count: sanitizeNumeric(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base font-bold bg-white"
                  />
                </div>
              </div>

              {/* Q.36 मोबाइल नंबर */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 36 मोबाइल नंबर (10 अंक)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.q36_mobile_number}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="10 अंकों का मोबाइल नंबर दर्ज करें"
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-wider font-bold bg-white focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                    errors.q36_mobile_number ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                />
                <p className="text-xs text-slate-500">
                  आधिकारिक निर्देश: प्रगणक द्वारा सत्यापन हेतु सक्रिय 10-अंकीय मोबाइल नंबर।
                </p>
                {errors.q36_mobile_number && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q36_mobile_number}</span>
                  </p>
                )}
              </div>

              {/* Q.37 आधार नंबर */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 37 आधार संख्या (12 अंक)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      q37_aadhaar_number: prev.q37_aadhaar_number === 'नहीं' ? '' : 'नहीं'
                    }))}
                    className="text-xs text-[#0B3B60] font-bold underline hover:text-blue-900"
                  >
                    {formData.q37_aadhaar_number === 'नहीं' ? '+ आधार नंबर दर्ज करें' : 'आधार उपलब्ध नहीं'}
                  </button>
                </div>

                <AadhaarDigitInput
                  value={formData.q37_aadhaar_number || ''}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, q37_aadhaar_number: val }));
                    if (errors.q37_aadhaar_number) setErrors((prev) => ({ ...prev, q37_aadhaar_number: undefined }));
                  }}
                  scannedLast4={scannedLast4}
                  error={errors.q37_aadhaar_number}
                />
                {errors.q37_aadhaar_number && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q37_aadhaar_number}</span>
                  </p>
                )}
              </div>

              {/* Q.38 वोटर आईडी (18+ वर्ष) */}
              {age >= 18 ? (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      प्र. 38 मतदाता पहचान पत्र (EPIC नंबर - 18 वर्ष+)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        q38_voter_id_epic: prev.q38_voter_id_epic === 'नहीं' ? '' : 'नहीं'
                      }))}
                      className="text-xs text-[#0B3B60] font-bold underline hover:text-blue-900"
                    >
                      {formData.q38_voter_id_epic === 'नहीं' ? '+ EPIC नंबर दर्ज करें' : 'वोटर आईडी उपलब्ध नहीं'}
                    </button>
                  </div>

                  {formData.q38_voter_id_epic === 'नहीं' ? (
                    <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-300 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="text-xs sm:text-sm font-bold text-slate-700">
                          मतदाता पहचान पत्र (EPIC) उपलब्ध नहीं है (प्रपत्र में <strong className="text-slate-900">'नहीं'</strong> दर्ज होगा)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, q38_voter_id_epic: '' }))}
                        className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-[#0B3B60] shadow-xs active:scale-95 transition-all"
                      >
                        + EPIC दर्ज करें
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.q38_voter_id_epic || ''}
                      onChange={(e) => handleVoterIdChange(e.target.value)}
                      placeholder="EPIC नंबर दर्ज करें (उदा. ABC1234567)"
                      className={`w-full px-3 py-2.5 border rounded-xl text-xs sm:text-sm font-mono uppercase font-bold bg-white focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                        errors.q38_voter_id_epic ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                    />
                  )}
                  {errors.q38_voter_id_epic && (
                    <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.q38_voter_id_epic}</span>
                    </p>
                  )}
                </div>
              ) : null}

              {/* Q.39 भारतीय पासपोर्ट (हो तो संख्या) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900">
                      प्र. 39 भारतीय पासपोर्ट (हो तो संख्या दर्ज करें)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      आधिकारिक जनगणना निर्देश: यदि व्यक्ति के पास वैध भारतीय पासपोर्ट उपलब्ध है तो 8-वर्णों की संख्या दर्ज करें।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      q39_passport_number: prev.q39_passport_number === 'नहीं' ? '' : 'नहीं'
                    }))}
                    className="text-xs text-[#0B3B60] font-bold underline hover:text-blue-900 shrink-0"
                  >
                    {formData.q39_passport_number === 'नहीं' ? '+ पासपोर्ट दर्ज करें' : 'पासपोर्ट उपलब्ध नहीं'}
                  </button>
                </div>

                {formData.q39_passport_number === 'नहीं' ? (
                  <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-300 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        पासपोर्ट उपलब्ध नहीं है (प्रपत्र में <strong className="text-slate-900">'नहीं'</strong> दर्ज होगा)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, q39_passport_number: '' }))}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-[#0B3B60] shadow-xs active:scale-95 transition-all"
                    >
                      + संख्या दर्ज करें
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    maxLength={8}
                    value={formData.q39_passport_number || ''}
                    onChange={(e) => handlePassportChange(e.target.value)}
                    placeholder="उदा. Z1234567 (1 अक्षर + 7 अंक)"
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs sm:text-sm font-mono uppercase font-black bg-white focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] tracking-widest ${
                      errors.q39_passport_number ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                )}

                {errors.q39_passport_number && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q39_passport_number}</span>
                  </p>
                )}
              </div>

              {/* Q.40 ड्राइविंग लाइसेंस (16+ वर्ष) */}
              {age >= 16 ? (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                    प्र. 40 ड्राइविंग लाइसेंस (16 वर्ष+)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, q40_driving_license: 1 })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border ${
                        formData.q40_driving_license === 1
                          ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      1 - हाँ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, q40_driving_license: 2 })}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border ${
                        formData.q40_driving_license === 2
                          ? 'bg-slate-700 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      2 - नहीं
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>

        {/* Footer Navigation & Save - Thumb-friendly Mobile Bar */}
        <div className="bg-white border-t border-slate-200 p-2.5 sm:p-3 shrink-0 flex items-center justify-between gap-2 shadow-lg">
          {activeTab > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab((prev) => prev - 1)}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm min-h-[44px] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पिछला</span>
            </button>
          ) : <div className="w-12" />}

          <span className="text-xs font-bold text-slate-500 font-mono hidden xs:inline">
            खंड {activeTab + 1} / {tabs.length}
          </span>

          <div className="flex items-center gap-2">
            {activeTab < tabs.length - 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => prev + 1)}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#0B3B60] hover:bg-[#134D7E] text-white font-bold text-xs sm:text-sm min-h-[44px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                >
                  <span>अगला खंड</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSaveMember}
                  title="अंतिम खंड से पहले भी सीधे सुरक्षित कर सकते हैं"
                  className="hidden sm:flex px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm min-h-[44px] items-center gap-1 active:scale-95 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>सुरक्षित करें</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveMember}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm min-h-[44px] flex items-center gap-1.5 active:scale-95 shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                <span>सदस्य विवरणी सुरक्षित करें</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Aadhaar QR Scanner Viewfinder Modal */}
      <AadhaarQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
