import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Info
} from 'lucide-react';
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
import { 
  sanitizeName, 
  sanitizeNumeric, 
  sanitizeText, 
  sanitizeAlphanumeric, 
  validateMemberRecord 
} from '../utils/validation';

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

  const initialData = {
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
    q10a_sc_st: 3,
    q10b_caste_code: '',
    q10c_caste_name: '',
    q11_father_in_hh: false,
    q11_father_serial_no: '',
    q11_father_name: '',
    q12_mother_in_hh: false,
    q12_mother_serial_no: '',
    q12_mother_name: '',
    q13a_disabled: 2,
    q13b_disability_types: [],
    q14a_mother_tongue: 'हिन्दी',
    q14b_other_languages: '',
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
      if (existingMember) {
        setFormData({ ...initialData, ...existingMember });
      } else {
        const newData = { ...initialData, serial_no: serialNo };
        if (serialNo > 1 && headMember) {
          newData.q9_religion = headMember.q9_religion || 1;
          newData.q9_religion_other = headMember.q9_religion_other || '';
          newData.q10a_sc_st = headMember.q10a_sc_st || 3;
          newData.q10b_caste_code = headMember.q10b_caste_code || '';
          newData.q10c_caste_name = headMember.q10c_caste_name || '';
          newData.q14a_mother_tongue = headMember.q14a_mother_tongue || 'हिन्दी';
          newData.q30_permanent_address_same = true;
          newData.q30_permanent_address = headMember.q30_permanent_address || '';
        }
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

  const potentialFathers = householdMembers.filter(m => m.serial_no !== formData.serial_no && m.q3_gender === 1);
  const potentialMothers = householdMembers.filter(m => m.serial_no !== formData.serial_no && m.q3_gender === 2);
  const potentialSpouses = householdMembers.filter(m => m.serial_no !== formData.serial_no);

  const handleNameChange = (val) => {
    const clean = sanitizeName(val);
    setFormData((prev) => ({ ...prev, q1_name: clean }));
    if (errors.q1_name) setErrors((prev) => ({ ...prev, q1_name: undefined }));
  };

  const handleAgeChange = (val) => {
    const clean = sanitizeNumeric(val);
    const num = clean === '' ? '' : Math.min(125, parseInt(clean, 10));
    setFormData((prev) => ({ ...prev, q4b_age: num }));
    if (errors.q4b_age) setErrors((prev) => ({ ...prev, q4b_age: undefined }));
  };

  const handleDobChange = (e) => {
    const dob = e.target.value;
    let calculatedAge = formData.q4b_age;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let diffYears = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        diffYears--;
      }
      if (diffYears >= 0 && diffYears < 125) {
        calculatedAge = diffYears;
      }
    }
    setFormData((prev) => ({ ...prev, q4a_dob: dob, q4b_age: calculatedAge }));
    if (errors.q4a_dob || errors.q4b_age) {
      setErrors((prev) => ({ ...prev, q4a_dob: undefined, q4b_age: undefined }));
    }
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
      } else if (validation.errors.q36_mobile_number || validation.errors.q37_aadhaar_number || validation.errors.q38_voter_id_epic) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 bg-slate-900/80 backdrop-blur-sm overflow-hidden font-['Hind']">
      <div className="bg-white rounded-2xl w-full max-w-xl h-[94vh] shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
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
            <div className="space-y-3.5">
              {/* Q.1 व्यक्ति का नाम */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
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
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                    errors.q1_name ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
                  }`}
                  autoFocus
                />
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>आधिकारिक निर्देश: व्यक्ति का पूरा नाम बिना किसी उपाधि के लिखें।</span>
                </p>
                {errors.q1_name && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q1_name}</span>
                  </p>
                )}
              </div>

              {/* Q.2 मुखिया से सम्बन्ध */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 2 परिवार के मुखिया से सम्बन्ध (कोड 01-32) <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q2_relationship}
                    onChange={(e) => setFormData({ ...formData, q2_relationship: Number(e.target.value) })}
                    disabled={formData.serial_no === 1}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {RELATIONSHIP_CODES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                {errors.q2_relationship && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q2_relationship}</span>
                  </p>
                )}
              </div>

              {/* Q.3 लिंग */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1.5">
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

              {/* Q.4 जन्म तिथि और आयु */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      प्र. 4(क) जन्म तिथि (उपलब्ध हो तो)
                    </label>
                    <input
                      type="date"
                      value={formData.q4a_dob}
                      onChange={handleDobChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-medium focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                      प्र. 4(ख) आयु पूर्ण वर्षों में <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q4b_age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      placeholder="वर्ष (1 से कम = 0)"
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                        errors.q4b_age ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>आधिकारिक निर्देश: आयु पूर्ण वर्षों में लिखें, 1 वर्ष से कम शिशु हेतु 0 दर्ज करें।</span>
                </p>
                {errors.q4b_age && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.q4b_age}</span>
                  </p>
                )}
              </div>

              {/* Q.5 वैवाहिक स्थिति */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 5 वर्तमान वैवाहिक स्थिति <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q5_marital_status}
                    onChange={(e) => setFormData({ ...formData, q5_marital_status: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {MARITAL_STATUS_CODES.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Q.6 & Q.7: यदि विवाहित हैं */}
              {isMarriedOrEver && (
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-sm space-y-2.5">
                  <div className="text-[11px] font-bold text-amber-900 border-b border-amber-200 pb-1">
                    विवाहित सदस्यों हेतु (प्र. 6 एवं प्र. 7):
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        प्र. 6 विवाह के समय आयु (वर्ष) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.q6_age_at_marriage}
                        onChange={(e) => setFormData({ ...formData, q6_age_at_marriage: sanitizeNumeric(e.target.value) })}
                        placeholder="विवाह की आयु"
                        className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-bold ${
                          errors.q6_age_at_marriage ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {errors.q6_age_at_marriage && (
                        <p className="text-[10px] text-red-600 mt-0.5">{errors.q6_age_at_marriage}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        प्र. 7 पति/पत्नी का परिवार में क्र.सं.
                      </label>
                      {potentialSpouses.length > 0 ? (
                        <div className="relative">
                          <select
                            value={formData.q7_spouse_serial_no}
                            onChange={(e) => setFormData({ ...formData, q7_spouse_serial_no: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold appearance-none pr-6"
                          >
                            <option value="">परिवार में नहीं / अन्य</option>
                            {potentialSpouses.map((s) => (
                              <option key={s.serial_no} value={s.serial_no}>
                                क्र. {s.serial_no} - {s.q1_name} ({s.q3_gender === 1 ? 'पु.' : 'महि.'})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.q7_spouse_serial_no}
                          onChange={(e) => setFormData({ ...formData, q7_spouse_serial_no: sanitizeNumeric(e.target.value) })}
                          placeholder="क्र.सं. दर्ज करें"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Q.8 & Q.9 धर्म */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 9 धर्म <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q9_religion}
                    onChange={(e) => setFormData({ ...formData, q9_religion: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {RELIGION_CODES.map((rel) => (
                      <option key={rel.code} value={rel.code}>
                        {rel.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {formData.q9_religion === 7 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      अन्य धर्म का नाम लिखें
                    </label>
                    <input
                      type="text"
                      value={formData.q9_religion_other}
                      onChange={(e) => setFormData({ ...formData, q9_religion_other: sanitizeText(e.target.value) })}
                      placeholder="धर्म का नाम"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: सामाजिक, माता-पिता एवं दिव्यांगता (प्र. 10 से 14) */}
          {activeTab === 1 && (
            <div className="space-y-3.5">
              {/* Q.10 सामाजिक श्रेणी */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 10(क) सामाजिक श्रेणी (SC / ST / अन्य) <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.q10a_sc_st}
                    onChange={(e) => setFormData({ ...formData, q10a_sc_st: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm sm:text-base focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  >
                    {SOCIAL_CATEGORY_CODES.map((sc) => (
                      <option key={sc.code} value={sc.code}>
                        {sc.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {formData.q10a_sc_st === 1 || formData.q10a_sc_st === 2 ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      प्र. 10(ख) SC/ST सूची से नाम व कोड
                    </label>
                    <input
                      type="text"
                      value={formData.q10b_caste_code}
                      onChange={(e) => setFormData({ ...formData, q10b_caste_code: sanitizeText(e.target.value) })}
                      placeholder="जाति का नाम व कोड"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      प्र. 10(ग) जाति का नाम (या 'नहीं बताना चाहते' / 'कोई जाति नहीं')
                    </label>
                    <input
                      type="text"
                      value={formData.q10c_caste_name}
                      onChange={(e) => setFormData({ ...formData, q10c_caste_name: sanitizeText(e.target.value) })}
                      placeholder="जाति का नाम दर्ज करें"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Q.11 पिता का विवरण */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">प्र. 11 पिता का विवरण</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.q11_father_in_hh}
                    onChange={(e) => setFormData({ ...formData, q11_father_in_hh: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0B3B60] focus:ring-[#0B3B60]"
                  />
                  <span className="text-xs font-semibold text-slate-700">पिता इसी परिवार में दर्ज हैं</span>
                </label>

                {formData.q11_father_in_hh ? (
                  potentialFathers.length > 0 ? (
                    <div className="relative">
                      <select
                        value={formData.q11_father_serial_no}
                        onChange={(e) => setFormData({ ...formData, q11_father_serial_no: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold appearance-none pr-8"
                      >
                        <option value="">परिवार में पिता का चयन करें</option>
                        {potentialFathers.map((f) => (
                          <option key={f.serial_no} value={f.serial_no}>
                            क्र. {f.serial_no} - {f.q1_name} ({f.q4b_age} वर्ष)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q11_father_serial_no}
                      onChange={(e) => setFormData({ ...formData, q11_father_serial_no: sanitizeNumeric(e.target.value) })}
                      placeholder="पिता का क्रम संख्या दर्ज करें (उदा. 1)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                    />
                  )
                ) : (
                  <input
                    type="text"
                    value={formData.q11_father_name}
                    onChange={(e) => setFormData({ ...formData, q11_father_name: sanitizeName(e.target.value) })}
                    placeholder="पिता का पूरा नाम"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-medium"
                  />
                )}
              </div>

              {/* Q.12 माता का विवरण */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">प्र. 12 माता का विवरण</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.q12_mother_in_hh}
                    onChange={(e) => setFormData({ ...formData, q12_mother_in_hh: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0B3B60] focus:ring-[#0B3B60]"
                  />
                  <span className="text-xs font-semibold text-slate-700">माता इसी परिवार में दर्ज हैं</span>
                </label>

                {formData.q12_mother_in_hh ? (
                  potentialMothers.length > 0 ? (
                    <div className="relative">
                      <select
                        value={formData.q12_mother_serial_no}
                        onChange={(e) => setFormData({ ...formData, q12_mother_serial_no: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-bold appearance-none pr-8"
                      >
                        <option value="">परिवार में माता का चयन करें</option>
                        {potentialMothers.map((m) => (
                          <option key={m.serial_no} value={m.serial_no}>
                            क्र. {m.serial_no} - {m.q1_name} ({m.q4b_age} वर्ष)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q12_mother_serial_no}
                      onChange={(e) => setFormData({ ...formData, q12_mother_serial_no: sanitizeNumeric(e.target.value) })}
                      placeholder="माता का क्रम संख्या दर्ज करें (उदा. 2)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                    />
                  )
                ) : (
                  <input
                    type="text"
                    value={formData.q12_mother_name}
                    onChange={(e) => setFormData({ ...formData, q12_mother_name: sanitizeName(e.target.value) })}
                    placeholder="माता का पूरा नाम"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-medium"
                  />
                )}
              </div>

              {/* Q.13 दिव्यांगता */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 13 कोई दिव्यांगता है?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q13a_disabled: 1 })}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      formData.q13a_disabled === 1
                        ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    1 - हाँ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q13a_disabled: 2 })}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      formData.q13a_disabled === 2
                        ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    2 - नहीं
                  </button>
                </div>

                {formData.q13a_disabled === 1 && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                      दिव्यांगता के प्रकार (अधिकतम 3 चुनें):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DISABILITY_CODES.map((d) => {
                        const isChecked = (formData.q13b_disability_types || []).includes(d.code);
                        return (
                          <button
                            key={d.code}
                            type="button"
                            onClick={() => {
                              const curr = formData.q13b_disability_types || [];
                              const updated = isChecked
                                ? curr.filter((c) => c !== d.code)
                                : [...curr, d.code].slice(0, 3);
                              setFormData({ ...formData, q13b_disability_types: updated });
                            }}
                            className={`px-2.5 py-2 rounded-lg text-left text-[11px] font-medium border ${
                              isChecked
                                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Q.14 मातृभाषा */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  प्र. 14(क) मातृभाषा
                </label>
                <input
                  type="text"
                  value={formData.q14a_mother_tongue}
                  onChange={(e) => setFormData({ ...formData, q14a_mother_tongue: sanitizeText(e.target.value) })}
                  placeholder="हिन्दी / ब्रजभाषा / अन्य"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base bg-white font-medium"
                />
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

              {/* Q.31 कभी जीवित जन्मी संतानें */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 31 कभी जीवित जन्मी कुल संतानें
                </label>
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

              {/* Q.32 वर्तमान में जीवित संतानें */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 32 वर्तमान में जीवित संतानें
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्री</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.q32_children_surviving_female}
                      onChange={(e) => setFormData({ ...formData, q32_children_surviving_female: sanitizeNumeric(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 font-semibold">पुत्र</label>
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

              {/* Q.33 पिछले 1 वर्ष में जन्मी संतानें */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  प्र. 33 पिछले 1 वर्ष में जीवित जन्मी संतानें
                </label>
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
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 37 आधार नंबर (12 अंक)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, q37_aadhaar_number: 'नहीं' })}
                    className="text-[10px] text-[#0B3B60] font-bold underline"
                  >
                    आधार उपलब्ध नहीं
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={12}
                  value={formData.q37_aadhaar_number}
                  onChange={(e) => handleAadhaarChange(e.target.value)}
                  placeholder="12 अंकों का आधार नंबर दर्ज करें"
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-wider font-bold bg-white focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                    errors.q37_aadhaar_number ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
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
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm space-y-1">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    प्र. 38 मतदाता पहचान पत्र (EPIC नंबर - 18 वर्ष+)
                  </label>
                  <input
                    type="text"
                    value={formData.q38_voter_id_epic}
                    onChange={(e) => handleVoterIdChange(e.target.value)}
                    placeholder="EPIC नंबर दर्ज करें (उदा. ABC1234567)"
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs sm:text-sm font-mono uppercase font-bold bg-white focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60] ${
                      errors.q38_voter_id_epic ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.q38_voter_id_epic && (
                    <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.q38_voter_id_epic}</span>
                    </p>
                  )}
                </div>
              ) : null}

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

        {/* Footer Navigation & Save */}
        <div className="bg-slate-100 border-t border-slate-200 p-3 shrink-0 flex items-center justify-between gap-2">
          {activeTab > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab((prev) => prev - 1)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm min-h-[42px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पूर्व खंड</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {activeTab < tabs.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => prev + 1)}
                className="px-4 py-2.5 rounded-xl bg-[#0B3B60] hover:bg-[#134D7E] text-white font-bold text-xs sm:text-sm min-h-[42px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <span>अगला खंड</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSaveMember}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm min-h-[42px] flex items-center gap-1.5 active:scale-95 shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>सदस्य विवरणी सुरक्षित करें</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
