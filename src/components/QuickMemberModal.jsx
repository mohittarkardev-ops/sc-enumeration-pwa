import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertCircle, Sparkles, ChevronDown, QrCode, CheckCircle2 } from 'lucide-react';
import {
  RELATIONSHIP_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
  RELIGION_CODES,
  SOCIAL_CATEGORY_CODES
} from '../constants/censusCodes';
import { sanitizeText, sanitizeNumeric, formatDobInput, parseAndValidateDob } from '../utils/validation';
import AadhaarQRScanner from './AadhaarQRScanner';
import AadhaarDigitInput from './AadhaarDigitInput';

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
  const [isAgeLocked, setIsAgeLocked] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState(1);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [scannedAddress, setScannedAddress] = useState('');
  const [scannedLast4, setScannedLast4] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mukhiya-specific social profile states (inherited by all other members)
  const [religion, setReligion] = useState(1);
  const [religionOther, setReligionOther] = useState('');
  const [sc, setSc] = useState(2); // 1 = Yes, 2 = No
  const [st, setSt] = useState(2); // 1 = Yes, 2 = No
  const [casteCode, setCasteCode] = useState('');
  const [casteName, setCasteName] = useState('');
  const [motherTongue, setMotherTongue] = useState('हिन्दी');

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
        setAadhaarNumber(existingMember.q37_aadhaar_number || '');
        setScannedAddress(existingMember.q30_permanent_address || '');
        setScannedLast4('');
        
        // Social profile
        setReligion(existingMember.q9_religion || 1);
        setReligionOther(existingMember.q9_religion_other || '');
        setSc(existingMember.q10a_sc || (existingMember.q10a_sc_st === 1 ? 1 : 2));
        setSt(existingMember.q10b_st || (existingMember.q10a_sc_st === 2 ? 1 : 2));
        setCasteCode(existingMember.q10b_caste_code || '');
        setCasteName(existingMember.q10c_caste_name || '');
        setMotherTongue(existingMember.q14a_mother_tongue || 'हिन्दी');

        if (existingMember.q4a_dob && existingMember.q4a_dob.trim().length === 10) {
          const res = parseAndValidateDob(existingMember.q4a_dob);
          setIsAgeLocked(res.isValid && res.calculatedAge !== null);
        } else {
          setIsAgeLocked(false);
        }
      } else {
        setName('');
        setDob('');
        setAge('');
        setIsAgeLocked(false);
        setAadhaarNumber('');
        setScannedAddress('');
        setScannedLast4('');
        setErrorMsg('');

        if (serialNo === 1) {
          // Head of Household
          setRelationship(1);
          setGender(1);
          setMaritalStatus(2); // Mostly married
          setReligion(1);
          setReligionOther('');
          setSc(2);
          setSt(2);
          setCasteCode('');
          setCasteName('');
          setMotherTongue('हिन्दी');
        } else {
          // If Head is married and no spouse exists yet, suggest 02 (पति/पत्नी)
          if (isHeadMarried && !hasSpouseAlready && serialNo === 2) {
            setRelationship(2);
            setGender(isHeadMale ? 2 : 1);
            setMaritalStatus(2);
          } else {
            setRelationship(3); // बेटा/बेटी
            setGender(1);
            setMaritalStatus(1); // अविवाहित
          }
          // Inherit social profile from Mukhiya
          setReligion(head?.q9_religion || 1);
          setReligionOther(head?.q9_religion_other || '');
          setSc(head?.q10a_sc || (head?.q10a_sc_st === 1 ? 1 : 2));
          setSt(head?.q10b_st || (head?.q10a_sc_st === 2 ? 1 : 2));
          setCasteCode(head?.q10b_caste_code || '');
          setCasteName(head?.q10c_caste_name || '');
          setMotherTongue(head?.q14a_mother_tongue || 'हिन्दी');
        }
      }
    }
  }, [isOpen, serialNo, existingMember, householdMembers]);

  if (!isOpen) return null;

  // Handle Aadhaar QR scan result
  const handleScanSuccess = (parsed) => {
    if (!parsed) return;
    if (parsed.name) setName(parsed.name);
    if (parsed.gender) setGender(parsed.gender);
    if (parsed.dob) {
      setDob(parsed.dob);
      if (parsed.age !== null && parsed.age !== undefined) {
        setAge(String(parsed.age));
        setIsAgeLocked(true);
        if (parsed.age < 10) {
          setMaritalStatus(1);
        }
      }
    } else if (parsed.age !== null && parsed.age !== undefined) {
      setAge(String(parsed.age));
      if (parsed.age < 10) {
        setMaritalStatus(1);
      }
    }
    // Only prefill aadhaar if full 12 unmasked digits exist
    if (parsed.aadhaarNumber && parsed.aadhaarNumber.length === 12 && !parsed.aadhaarNumber.includes('X')) {
      setAadhaarNumber(parsed.aadhaarNumber);
    }
    if (parsed.address) {
      setScannedAddress(parsed.address);
    }
    if (parsed.last4) {
      setScannedLast4(parsed.last4);
    }
    setErrorMsg('');
  };

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
      setGender(2); // महिला
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
        setIsAgeLocked(true);
        setErrorMsg('');
        // If age < 10, lock to unmarried
        if (res.calculatedAge < 10) {
          setMaritalStatus(1);
        } else if (res.calculatedAge < 18 && relationship !== 2) {
          setMaritalStatus(1);
        }
      } else {
        setIsAgeLocked(false);
        setErrorMsg(res.message);
      }
    } else {
      setIsAgeLocked(false);
    }
  };

  const handleAgeInput = (val) => {
    const clean = sanitizeNumeric(val).slice(0, 3);
    setAge(clean);
    const num = parseInt(clean, 10);
    if (!isNaN(num)) {
      if (num < 10) {
        setMaritalStatus(1);
      } else if (num < 18 && relationship !== 2) {
        setMaritalStatus(1);
      }
    }
  };

  const handleSubmit = (addAnother = false) => {
    const cleanName = sanitizeText(name);
    if (!cleanName) {
      setErrorMsg('कृपया सदस्य का नाम दर्ज करें।');
      return;
    }

    const finalAge = age !== '' ? parseInt(age, 10) : 0;

    // Strict Aadhaar Validation: Must be exactly 12 digits, 'नहीं', or empty
    let cleanAadhaar = '';
    if (aadhaarNumber === 'नहीं' || aadhaarNumber === 'उपलब्ध नहीं') {
      cleanAadhaar = 'नहीं';
    } else if (aadhaarNumber) {
      const cleanDigits = sanitizeNumeric(aadhaarNumber);
      if (cleanDigits.length > 0 && cleanDigits.length < 12) {
        setErrorMsg(`आधार संख्या अधूरी है (${cleanDigits.length}/12 अंक)। कृपया पूरे 12 अंक दर्ज करें या 'आधार उपलब्ध नहीं' चुनें।`);
        return;
      }
      if (cleanDigits.length === 12) {
        cleanAadhaar = cleanDigits;
      }
    }

    const finalSocialCategory = sc === 1 ? 1 : (st === 1 ? 2 : 3);

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
      q9_religion: serialNo === 1 ? Number(religion) : (existingMember?.q9_religion || head?.q9_religion || 1),
      q9_religion_other: serialNo === 1 ? religionOther : (existingMember?.q9_religion_other || head?.q9_religion_other || ''),
      q10a_sc_st: serialNo === 1 ? finalSocialCategory : (existingMember?.q10a_sc_st || head?.q10a_sc_st || 3),
      q10a_sc: serialNo === 1 ? sc : (existingMember?.q10a_sc || head?.q10a_sc || 2),
      q10b_st: serialNo === 1 ? st : (existingMember?.q10b_st || head?.q10b_st || 2),
      q10b_caste_code: serialNo === 1 ? casteCode : (existingMember?.q10b_caste_code || head?.q10b_caste_code || ''),
      q10c_caste_name: serialNo === 1 ? casteName : (existingMember?.q10c_caste_name || head?.q10c_caste_name || ''),
      q13a_disabled: existingMember?.q13a_disabled || 2,
      q14a_mother_tongue: serialNo === 1 ? motherTongue : (existingMember?.q14a_mother_tongue || head?.q14a_mother_tongue || 'हिन्दी'),
      q30_permanent_address_same: !scannedAddress,
      q30_permanent_address: scannedAddress || existingMember?.q30_permanent_address || head?.q30_permanent_address || '',
      q35_bank_accounts_count: existingMember?.q35_bank_accounts_count || 1,
      q36_mobile_number: existingMember?.q36_mobile_number || (serialNo === 1 ? '' : head?.q36_mobile_number || ''),
      q37_aadhaar_number: cleanAadhaar
    };

    onSave(memberData, addAnother);

    if (addAnother) {
      setName('');
      setDob('');
      setAge('');
      setIsAgeLocked(false);
      setAadhaarNumber('');
      setScannedAddress('');
      setRelationship(3); // Default to son/daughter for next member
      setGender(1);
      setMaritalStatus(1);
      setErrorMsg('');
    } else {
      onClose();
    }
  };

  const parsedAgeNum = age !== '' ? parseInt(age, 10) : NaN;
  const isUnder10 = !isNaN(parsedAgeNum) && parsedAgeNum < 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-fadeIn">
        
        {/* Header */}
        <div className="bg-[#0B3B60] text-white px-4 py-3 sm:py-3.5 flex items-center justify-between border-b border-[#072F5F] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-sm shadow-sm">
              #{serialNo}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {serialNo === 1 ? 'मुखिया का त्वरित विवरण' : `सदस्य संख्या ${serialNo} का त्वरित विवरण`}
              </h2>
              <p className="text-[11px] text-slate-200">
                त्वरित प्रविष्टि • संबंध, जाति व धर्म स्वतः इनहेरिट होंगे
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

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 momentum-scroll">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Aadhaar QR Scanner Fast Action Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 rounded-2xl border border-blue-200 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#0B3B60] text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">आधार कार्ड QR स्कैनर</p>
                <p className="text-[10px] text-slate-600">नाम, लिंग, जन्म तिथि व पता स्वतः भरें</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0B3B60] hover:bg-[#072F5F] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <span>📷 QR स्कैन करें</span>
            </button>
          </div>

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
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
                ५. वैवाहिक स्थिति <span className="text-red-600">*</span>
              </label>
              {isUnder10 && (
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  १० वर्ष से कम: १-अविवाहित
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { code: 1, label: '1 - अविवाहित' },
                { code: 2, label: '2 - विवाहित' },
                { code: 3, label: '3 - विधवा/विधुर' },
                { code: 4, label: '4 - सम्बन्ध विच्छेद' },
                { code: 5, label: '5 - तलाकशुदा' }
              ].map((m) => {
                const isLockedUnmarried = isUnder10 && m.code !== 1;
                return (
                  <button
                    key={m.code}
                    type="button"
                    disabled={isLockedUnmarried}
                    onClick={() => setMaritalStatus(m.code)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      maritalStatus === m.code
                        ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                        : isLockedUnmarried
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SERIAL 1: MUKHIYA SOCIAL PROFILE (Q.9, Q.10, Q.14) */}
          {serialNo === 1 ? (
            <div className="space-y-3 bg-amber-50/60 p-3 sm:p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 pb-1 border-b border-amber-200">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>परिवार विशेषता (मुखिया का धर्म, वर्ग व जाति विवरण - बाकी सदस्यों के लिए स्वतः लागू)</span>
              </div>

              {/* Q.9 धर्म */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  ९. धर्म <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <select
                    value={religion}
                    onChange={(e) => setReligion(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white appearance-none pr-8 text-sm focus:ring-2 focus:ring-[#0B3B60]/20"
                  >
                    {RELIGION_CODES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                {religion === 7 && (
                  <input
                    type="text"
                    value={religionOther}
                    onChange={(e) => setReligionOther(sanitizeText(e.target.value))}
                    placeholder="अन्य धर्म का नाम लिखें"
                    className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                )}
              </div>

              {/* Q.10 सामाजिक वर्ग (SC / ST / General / OBC) */}
              <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  १०. अनुसूचित जाति (SC) / अनुसूचित जनजाति (ST) विवरण <span className="text-red-600">*</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* SC Toggle */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">१०(क) क्या SC हैं?</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setSc(1); setSt(2); }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          sc === 1 ? 'bg-[#0B3B60] text-white border-[#072F5F]' : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        1 - हाँ
                      </button>
                      <button
                        type="button"
                        onClick={() => setSc(2)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          sc === 2 ? 'bg-slate-700 text-white border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        2 - नहीं
                      </button>
                    </div>
                  </div>

                  {/* ST Toggle */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">१०(ख) क्या ST हैं?</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={sc === 1}
                        onClick={() => { setSt(1); setSc(2); }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          st === 1 ? 'bg-[#0B3B60] text-white border-[#072F5F]' : 'bg-slate-50 text-slate-700 border-slate-300 disabled:opacity-40'
                        }`}
                      >
                        1 - हाँ
                      </button>
                      <button
                        type="button"
                        onClick={() => setSt(2)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          st === 2 ? 'bg-slate-700 text-white border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        2 - नहीं
                      </button>
                    </div>
                  </div>
                </div>

                {/* Caste Name Input */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      {sc === 1 ? 'SC जाति का नाम:' : st === 1 ? 'ST जाति का नाम:' : '१०(ग) जाति का नाम / संवर्ग:'}
                    </label>
                    {sc === 1 && (
                      <span className="text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                        SC सूची अनुसार
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={casteName}
                    onChange={(e) => setCasteName(sanitizeText(e.target.value))}
                    placeholder="उदा. जाटव, यादव, ब्राह्मण, ठाकुर, मौर्य, कुर्मी"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                  />
                  {/* Quick Caste Chips */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                    {['सामान्य (General)', 'ओबीसी (OBC)', 'यादव', 'जाटव', 'ब्राह्मण', 'ठाकुर', 'मौर्य', 'कुर्मी'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCasteName(chip)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 border border-slate-300 shrink-0 active:scale-95 transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Q.14(क) मातृभाषा */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  १४(क) मातृभाषा <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={motherTongue}
                  onChange={(e) => setMotherTongue(sanitizeText(e.target.value))}
                  placeholder="उदा. हिन्दी, उर्दू, पंजाबी, ब्रजभाषा"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                />
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  {['हिन्दी', 'उर्दू', 'पंजाबी', 'ब्रजभाषा', 'भोजपुरी'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setMotherTongue(lang)}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                        motherTongue === lang
                          ? 'bg-[#0B3B60] text-white border-[#072F5F]'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* SERIAL 2+: SMART INHERITANCE BADGE */
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>परिवार विशेषता (मुखिया से स्वतः लिंक)</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Smart Inherit
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                  <span className="text-slate-500 text-[10px] block">धर्म</span>
                  <span className="font-bold text-slate-800">
                    {RELIGION_CODES.find((r) => r.code === Number(head?.q9_religion))?.label || '1 - हिन्दू'}
                  </span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                  <span className="text-slate-500 text-[10px] block">वर्ग व जाति</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {head?.q10a_sc_st === 1 ? 'SC' : head?.q10a_sc_st === 2 ? 'ST' : 'सामान्य/अन्य'}
                    {head?.q10c_caste_name ? ` (${head.q10c_caste_name})` : ''}
                  </span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                  <span className="text-slate-500 text-[10px] block">मातृभाषा</span>
                  <span className="font-bold text-slate-800">
                    {head?.q14a_mother_tongue || 'हिन्दी'}
                  </span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-amber-100">
                  <span className="text-slate-500 text-[10px] block">स्थायी पता</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">
                    मुखिया के समान
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                परिवार के सभी सदस्यों के लिए यह विवरण स्वतः समान रखा गया है।
              </p>
            </div>
          )}

          {/* ३७. आधार संख्या (Aadhaar Number) */}
          <div className="space-y-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
                ३७. आधार संख्या (Aadhaar Number)
              </label>
              <button
                type="button"
                onClick={() => setAadhaarNumber(aadhaarNumber === 'नहीं' ? '' : 'नहीं')}
                className="text-xs text-[#0B3B60] font-bold underline hover:text-blue-900 active:scale-95"
              >
                {aadhaarNumber === 'नहीं' ? '+ आधार नंबर दर्ज करें' : 'आधार उपलब्ध नहीं'}
              </button>
            </div>
            <AadhaarDigitInput
              value={aadhaarNumber}
              onChange={(val) => setAadhaarNumber(val)}
              scannedLast4={scannedLast4}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 py-3 sm:py-3.5 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
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

      {/* Aadhaar QR Scanner Viewfinder Modal */}
      <AadhaarQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
