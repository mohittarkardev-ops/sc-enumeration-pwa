import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import { RELATIONSHIP_CODES, GENDER_CODES, MARITAL_STATUS_CODES } from '../constants/censusCodes';
import { sanitizeText, sanitizeNumeric, formatDobInput, parseAndValidateDob } from '../utils/validation';

export default function QuickMemberModal({
  isOpen,
  onClose,
  onSave,
  serialNo = 1,
  existingMember = null,
  householdMembers = []
}) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState(serialNo === 1 ? 1 : 3);
  const [gender, setGender] = useState(1);
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [maritalStatus, setMaritalStatus] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  const head = householdMembers.find((m) => Number(m.q2_relationship) === 1);
  const isHeadMale = head ? Number(head.q3_gender) === 1 : true;
  const isHeadMarried = head ? Number(head.q5_marital_status) === 2 : false;
  const hasSpouseAlready = householdMembers.some((m) => Number(m.q2_relationship) === 2);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (existingMember) {
        setName(existingMember.q1_name || '');
        setRelationship(Number(existingMember.q2_relationship) || (serialNo === 1 ? 1 : 3));
        setGender(Number(existingMember.q3_gender) || 1);
        setDob(existingMember.q4a_dob || '');
        setAge(existingMember.q4b_age !== undefined ? String(existingMember.q4b_age) : '');
        setMaritalStatus(Number(existingMember.q5_marital_status) || 1);
      } else {
        setName('');
        setDob('');
        setAge('');
        setErrorMsg('');

        if (serialNo === 1) {
          // Head of Household
          setRelationship(1);
          setGender(1);
          setMaritalStatus(2); // Mostly married
        } else {
          // If Head is married and no spouse exists yet, suggest 02 (पति/पत्नी)
          // BUT if Head has no spouse, or already has spouse, default to 03 (बेटा/बेटी)
          if (isHeadMarried && !hasSpouseAlready && serialNo === 2) {
            setRelationship(2);
            setGender(isHeadMale ? 2 : 1);
            setMaritalStatus(2);
          } else {
            setRelationship(3); // बेटा/बेटी
            setGender(1);
            setMaritalStatus(1); // अविवाहित
          }
        }
      }
    }
  }, [isOpen, serialNo, existingMember, householdMembers]);

  if (!isOpen) return null;

  // Smart gender & marital status auto-adjust on relationship change
  const handleRelationshipSelect = (relCode) => {
    const code = Number(relCode);
    setRelationship(code);
    if (code === 2) {
      // Spouse of head
      setGender(isHeadMale ? 2 : 1);
      setMaritalStatus(2); // विवाहित
    } else if (code === 4) {
      // Daughter-in-law (बहू)
      setGender(2);
      setMaritalStatus(2); // विवाहित
    } else if (code === 12) {
      // Father or Mother of Head
      setMaritalStatus(2);
    }
  };

  const handleDobInput = (val) => {
    const formatted = formatDobInput(val);
    setDob(formatted);
    if (formatted.length === 10) {
      const res = parseAndValidateDob(formatted);
      if (res.isValid && res.calculatedAge !== null) {
        setAge(String(res.calculatedAge));
        setErrorMsg('');
        // If age < 18, set unmarried
        if (res.calculatedAge < 18 && relationship !== 2) {
          setMaritalStatus(1);
        }
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleAgeInput = (val) => {
    const clean = sanitizeNumeric(val).slice(0, 3);
    setAge(clean);
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num < 18 && relationship !== 2) {
      setMaritalStatus(1);
    }
  };

  const handleSubmit = (addAnother = false) => {
    const cleanName = sanitizeText(name);
    if (!cleanName) {
      setErrorMsg('कृपया सदस्य का नाम दर्ज करें।');
      return;
    }

    const finalAge = age !== '' ? parseInt(age, 10) : 0;

    const memberData = {
      ...(existingMember || {}),
      local_id: existingMember?.local_id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      serial_no: serialNo,
      q1_name: cleanName,
      q2_relationship: Number(relationship),
      q3_gender: Number(gender),
      q4a_dob: dob.length === 10 ? dob : '',
      q4b_age: finalAge,
      q5_marital_status: Number(maritalStatus),
      q8_nationality: existingMember?.q8_nationality || 'भारत',
      q9_religion: existingMember?.q9_religion || head?.q9_religion || 1,
      q10a_sc_st: existingMember?.q10a_sc_st || head?.q10a_sc_st || 3,
      q10c_caste_name: existingMember?.q10c_caste_name || head?.q10c_caste_name || '',
      q13a_disabled: existingMember?.q13a_disabled || 2,
      q14a_mother_tongue: existingMember?.q14a_mother_tongue || head?.q14a_mother_tongue || 'हिन्दी',
      q30_permanent_address_same: true,
      q35_bank_accounts_count: existingMember?.q35_bank_accounts_count || 1,
      q36_mobile_number: existingMember?.q36_mobile_number || (serialNo === 1 ? '' : head?.q36_mobile_number || '')
    };

    onSave(memberData, addAnother);

    if (addAnother) {
      setName('');
      setDob('');
      setAge('');
      setRelationship(3); // Default to son/daughter for next member
      setGender(1);
      setMaritalStatus(1);
      setErrorMsg('');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 overflow-y-auto font-['Hind']">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0B3B60] text-white px-4 py-3 sm:py-3.5 flex items-center justify-between border-b border-[#072F5F]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-sm shadow-sm">
              #{serialNo}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {serialNo === 1 ? 'मुखिया का त्वरित विवरण' : `सदस्य संख्या ${serialNo} का त्वरित विवरण`}
              </h2>
              <p className="text-[11px] text-slate-200">
                त्वरित 30-सेकंड प्रविष्टि • संबंध व क्रम संख्या स्वतः लिंक होंगे
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. व्यक्ति का नाम */}
          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
              १. व्यक्ति का नाम <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="व्यक्ति का नाम दर्ज करें (उदा. रमेश कुमार)"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
              autoFocus
            />
          </div>

          {/* 2. मुखिया से संबंध */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
              २. परिवार के मुखिया से सम्बन्ध <span className="text-red-600">*</span>
            </label>
            
            {serialNo === 1 ? (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-black text-sm flex items-center justify-between">
                <span>01 - परिवार का मुखिया (Head of Household)</span>
                <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">स्वतः निर्धारित</span>
              </div>
            ) : (
              <>
                {/* Fast One-Tap Relationship Chips for Top Roles */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { code: 2, label: '02 पति/पत्नी' },
                    { code: 3, label: '03 बेटा/बेटी' },
                    { code: 4, label: '04 बहू' },
                    { code: 6, label: '06 पोता/पोती' },
                    { code: 12, label: '12 माता/पिता' },
                    { code: 13, label: '13 भाई/बहन' }
                  ].map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => handleRelationshipSelect(r.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border active:scale-95 ${
                        relationship === r.code
                          ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Dropdown for All Relationship Codes */}
                <div className="relative pt-1">
                  <select
                    value={relationship}
                    onChange={(e) => handleRelationshipSelect(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm focus:ring-2 focus:ring-[#0B3B60]/20"
                  >
                    {RELATIONSHIP_CODES.filter((r) => r.code !== 1).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-4 pointer-events-none" />
                </div>
              </>
            )}
          </div>

          {/* 3. लिंग (Gender) */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
              ३. लिंग <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_CODES.map((g) => (
                <button
                  key={g.code}
                  type="button"
                  onClick={() => setGender(g.code)}
                  className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] border transition-all active:scale-95 ${
                    gender === g.code
                      ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. जन्म तिथि व पूर्ण आयु */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                ४(क) जन्म तिथि (DD/MM/YYYY)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={dob}
                onChange={(e) => handleDobInput(e.target.value)}
                placeholder="उदा. 15082000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm sm:text-base font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20"
              />
              <span className="text-[11px] text-slate-500 block">८ अंक टाइप करें</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                ४(ख) पूर्ण आयु (वर्ष) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={age}
                onChange={(e) => handleAgeInput(e.target.value)}
                placeholder="उदा. 24"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20"
              />
              <span className="text-[11px] text-slate-500 block">पूर्ण वर्ष</span>
            </div>
          </div>

          {/* 5. वैवाहिक स्थिति */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
              ५. वैवाहिक स्थिति <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { code: 1, label: '1 - अविवाहित' },
                { code: 2, label: '2 - विवाहित' },
                { code: 3, label: '3 - विधवा/विधुर' },
                { code: 4, label: '4 - सम्बन्ध विच्छेद' },
                { code: 5, label: '5 - तलाकशुदा' }
              ].map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setMaritalStatus(m.code)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    maritalStatus === m.code
                      ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 py-3 sm:py-3.5 border-t border-slate-200 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 min-h-[44px]"
          >
            रद्द करें
          </button>

          <div className="flex items-center gap-2">
            {!existingMember && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B3B60] border border-blue-200 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-xs min-h-[44px] flex items-center gap-1"
                title="यह सदस्य जोड़कर तुरंत अगला सदस्य भरें"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden xs:inline">जोड़ें व</span> <span>+ अगला सदस्य</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm active:scale-95 transition-all shadow-md min-h-[44px] flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{existingMember ? 'संशोधन सुरक्षित करें' : 'सदस्य जोड़ें'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
