import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Home, 
  Users, 
  Save, 
  AlertCircle,
  XCircle,
  ShieldCheck,
  Phone,
  CreditCard,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  FileText,
  Sparkles,
  Heart,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { db } from '../db/db';
import { 
  HOUSEHOLD_TYPE_CODES, 
  RELATIONSHIP_CODES, 
  GENDER_CODES, 
  RELIGION_CODES, 
  SOCIAL_CATEGORY_CODES 
} from '../constants/censusCodes';
import MemberModal from './MemberModal';
import QuickMemberModal from './QuickMemberModal';
import { resolveFamilyRelationships, getMemberDropdownOptions } from '../utils/familyTreeResolver';
import { syncPendingData } from '../db/supabase';
import { sanitizeAlphanumeric, sanitizeText } from '../utils/validation';

const pad3 = (val) => {
  const num = parseInt(val, 10);
  if (isNaN(num)) return val || '001';
  return num.toString().padStart(3, '0');
};

export default function HouseholdEntry({
  activeSection,
  settings,
  onOpenSettings,
  onHouseholdSaved,
  editingHousehold = null,
  editingMembers = [],
  onCancelEditing
}) {
  const [entryStep, setEntryStep] = useState(1); // 1 = सदस्य तालिका (Roster), 2 = पारिवारिक सारांश व प्रश्न (Family Level)
  const [currentLocalId, setCurrentLocalId] = useState(null);
  const [buildingNo, setBuildingNo] = useState(settings?.last_building_no || '001');
  const [censusHouseNo, setCensusHouseNo] = useState(settings?.last_census_house_no || '001');
  const [householdNo, setHouseholdNo] = useState(settings?.last_household_no || '001');
  const [householdType, setHouseholdType] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('completed');

  // Household-Level Shared Master Values
  const [hhReligion, setHhReligion] = useState(1); // 1 = हिन्दू
  const [hhSocialCategory, setHhSocialCategory] = useState(3); // 3 = सामान्य / अन्य
  const [hhCasteName, setHhCasteName] = useState('');
  const [hhCasteCode, setHhCasteCode] = useState('');
  const [hhMotherTongue, setHhMotherTongue] = useState('हिन्दी');
  const [hhPermanentSame, setHhPermanentSame] = useState(true);
  const [hhPermanentAddress, setHhPermanentAddress] = useState('');

  // Members List & Modals
  const [members, setMembers] = useState([]);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [activeMemberIndex, setActiveMemberIndex] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Active Section Name
  const activeSectionObj = (settings?.sections || []).find((s) => s.id === activeSection);
  const activeSectionName = activeSectionObj ? activeSectionObj.name : `सेक्शन ${activeSection}`;

  useEffect(() => {
    if (editingHousehold) {
      setCurrentLocalId(editingHousehold.local_id);
      setBuildingNo(editingHousehold.building_no);
      setCensusHouseNo(editingHousehold.census_house_no);
      setHouseholdNo(editingHousehold.household_no);
      setHouseholdType(editingHousehold.household_type || 1);
      setRemarks(editingHousehold.remarks || '');
      setStatus(editingHousehold.status || 'completed');
      
      const resolved = resolveFamilyRelationships(editingMembers || []);
      setMembers(resolved);

      if (editingMembers.length > 0) {
        setHhReligion(editingMembers[0].q9_religion || 1);
        setHhSocialCategory(editingMembers[0].q10a_sc_st || 3);
        setHhCasteName(editingMembers[0].q10c_caste_name || '');
        setHhMotherTongue(editingMembers[0].q14a_mother_tongue || 'हिन्दी');
      }

      setFeedbackMsg(`संशोधन हेतु परिवार क्रमांक ${editingHousehold.household_no} लोड किया गया।`);
    } else if (settings) {
      setCurrentLocalId(null);
      if (settings.last_building_no) setBuildingNo(settings.last_building_no);
      if (settings.last_census_house_no) setCensusHouseNo(settings.last_census_house_no);
      if (settings.last_household_no) setHouseholdNo(settings.last_household_no);
    }
  }, [editingHousehold, editingMembers, settings]);

  const adjustNumber = (current, setter, delta) => {
    const num = parseInt(current, 10);
    if (isNaN(num)) {
      setter('001');
      return;
    }
    const nextVal = Math.max(1, num + delta);
    setter(pad3(nextVal));
  };

  // Open Quick Add Modal
  const handleOpenQuickAdd = () => {
    setFormError('');
    setActiveMemberIndex(null);
    setIsQuickModalOpen(true);
  };

  // Open Quick Edit
  const handleOpenQuickEdit = (idx) => {
    setFormError('');
    setActiveMemberIndex(idx);
    setIsQuickModalOpen(true);
  };

  // Open Full 40-Q Member Modal
  const handleOpenFullModal = (idx = null) => {
    setFormError('');
    setActiveMemberIndex(idx);
    setIsFullModalOpen(true);
  };

  // Save from Quick Modal
  const handleSaveQuickMember = (memberData, addAnother = false) => {
    let updated = [...members];
    if (activeMemberIndex !== null) {
      updated[activeMemberIndex] = memberData;
    } else {
      updated.push(memberData);
    }

    // Auto-resolve family relationships intelligently:
    const resolved = resolveFamilyRelationships(updated);
    setMembers(resolved);

    if (activeMemberIndex === 0 || updated.length === 1) {
      setHhReligion(memberData.q9_religion || 1);
      setHhSocialCategory(memberData.q10a_sc_st || 3);
      setHhCasteName(memberData.q10c_caste_name || '');
      setHhMotherTongue(memberData.q14a_mother_tongue || 'हिन्दी');
    }

    if (addAnother) {
      setActiveMemberIndex(null);
    } else {
      setIsQuickModalOpen(false);
      setActiveMemberIndex(null);
    }
  };

  // Save from Full Modal
  const handleSaveFullMember = (memberData) => {
    let updated = [...members];
    const memberWithId = {
      ...memberData,
      local_id: memberData.local_id || `mem_temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    if (activeMemberIndex !== null) {
      updated[activeMemberIndex] = memberWithId;
    } else {
      updated.push(memberWithId);
    }

    const resolved = resolveFamilyRelationships(updated);
    setMembers(resolved);
    setIsFullModalOpen(false);
    setActiveMemberIndex(null);
  };

  const handleDeleteMember = (index) => {
    if (confirm('क्या आप इस सदस्य की प्रविष्टि हटाना चाहते हैं?')) {
      const updated = members.filter((_, i) => i !== index).map((m, idx) => ({
        ...m,
        serial_no: idx + 1
      }));
      const resolved = resolveFamilyRelationships(updated);
      setMembers(resolved);
    }
  };

  // Update relational link manually in Step 2
  const handleUpdateRelation = (memberIndex, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[memberIndex] = {
        ...copy[memberIndex],
        [field]: value
      };
      return copy;
    });
  };

  // Step 1 -> Step 2 validation
  const handleProceedToStep2 = () => {
    setFormError('');
    if (members.length === 0) {
      setFormError('कृपया पहले कम से कम परिवार के मुखिया का विवरण जोड़ें।');
      return;
    }
    setEntryStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Complete Save
  const handleSaveHousehold = async () => {
    setFormError('');

    if (members.length === 0) {
      setFormError('प्रपत्र सुरक्षित करने हेतु कम से कम परिवार के मुखिया (क्र.सं. 1) का विवरण जोड़ना अनिवार्य है।');
      setEntryStep(1);
      return;
    }

    const cleanBuilding = sanitizeAlphanumeric(buildingNo);
    const cleanHouse = sanitizeAlphanumeric(censusHouseNo);
    const cleanHousehold = sanitizeAlphanumeric(householdNo);

    if (!cleanBuilding || !cleanHouse || !cleanHousehold) {
      setFormError('कृपया भवन सं., जनगणना मकान सं. एवं परिवार संख्या दर्ज करें।');
      setEntryStep(1);
      return;
    }

    const householdLocalId = currentLocalId || ('hh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    const head = members[0];

    const householdRecord = {
      local_id: householdLocalId,
      enumerator_id: settings?.enumerator_id || 'ENUM-001',
      state_name: settings?.state_name || 'उत्तर प्रदेश (Uttar Pradesh)',
      district_name: settings?.district_name || 'मथुरा (Mathura)',
      tehsil_block: settings?.tehsil_block || 'मथुरा (Mathura)',
      ward_village_name: settings?.ward_village_name || 'अज्ञात ग्राम',
      enumeration_block_no: settings?.enumeration_block_no || '001',
      village_section: (editingHousehold && editingHousehold.village_section) ? editingHousehold.village_section : activeSection,
      building_no: cleanBuilding,
      census_house_no: cleanHouse,
      household_no: cleanHousehold,
      household_type: Number(householdType),
      total_members: members.length,
      head_name: head ? head.q1_name : '',
      status: status,
      remarks: sanitizeText(remarks),
      sync_status: 'pending',
      created_at: editingHousehold ? editingHousehold.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.households.put(householdRecord);

    if (currentLocalId) {
      await db.members.where('household_local_id').equals(currentLocalId).delete();
    }

    // Apply shared household religion / caste / mother tongue to members who don't have custom ones
    for (let idx = 0; idx < members.length; idx++) {
      const mem = members[idx];
      const memberLocalId = mem.local_id && !mem.local_id.startsWith('mem_temp_') 
        ? mem.local_id 
        : `mem_${householdLocalId}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`;

      const memberRecord = {
        ...mem,
        local_id: memberLocalId,
        serial_no: idx + 1,
        household_local_id: householdLocalId,
        q9_religion: mem.q9_religion || hhReligion,
        q10a_sc_st: mem.q10a_sc_st || hhSocialCategory,
        q10c_caste_name: mem.q10c_caste_name || hhCasteName,
        q14a_mother_tongue: mem.q14a_mother_tongue || hhMotherTongue,
        sync_status: 'pending',
        created_at: mem.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await db.members.put(memberRecord);
    }

    // Auto-increment household number for next entry
    const nextHhNum = pad3(parseInt(cleanHousehold, 10) + 1);
    setHouseholdNo(nextHhNum);

    await db.settings.update('active_settings', {
      last_building_no: cleanBuilding,
      last_census_house_no: cleanHouse,
      last_household_no: nextHhNum
    });

    setMembers([]);
    setRemarks('');
    setCurrentLocalId(null);
    setEntryStep(1);

    setFeedbackMsg(`परिवार क्रमांक ${householdRecord.household_no} का संपूर्ण प्रपत्र (${members.length} सदस्य) सफलतापूर्वक सुरक्षित हुआ।`);
    setTimeout(() => setFeedbackMsg(''), 5500);

    if (navigator.onLine) {
      syncPendingData().catch((err) => console.warn('Sync notice:', err));
    }

    if (onHouseholdSaved) onHouseholdSaved();
  };

  const getRelLabel = (code) => {
    const item = RELATIONSHIP_CODES.find((r) => r.code === Number(code));
    return item ? item.label : code;
  };

  const getGenderLabel = (code) => {
    const item = GENDER_CODES.find((g) => g.code === Number(code));
    return item ? item.short : code;
  };

  // Helper for names in relations display
  const getMemberNameBySerial = (sNo) => {
    if (!sNo || sNo === '00' || sNo === 0) return 'परिवार से बाहर / नहीं';
    const found = members.find((m) => m.serial_no === Number(sNo));
    return found ? `${found.q1_name} (क्र. ${found.serial_no})` : `क्र. ${sNo}`;
  };

  return (
    <div className="p-3 sm:p-4 max-w-2xl mx-auto space-y-3.5 pb-28 font-['Hind'] text-sm">
      
      {/* Editing Notification Banner */}
      {currentLocalId && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 p-3 sm:p-3.5 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm">
          <span>संशोधन मोड: परिवार क्रमांक #{householdNo} का प्रपत्र संपादित किया जा रहा है।</span>
          <button
            type="button"
            onClick={onCancelEditing}
            className="flex items-center gap-1 text-slate-800 hover:text-black font-black underline ml-2"
          >
            <XCircle className="w-4 h-4" />
            <span>रद्द करें</span>
          </button>
        </div>
      )}

      {/* 2-Step Progress Navigation Header */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setEntryStep(1)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
            entryStep === 1
              ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">1</span>
          <span>चरण 1: सदस्य तालिका ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={handleProceedToStep2}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
            entryStep === 2
              ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">2</span>
          <span>चरण 2: पारिवारिक संबंध व सारांश</span>
        </button>
      </div>

      {/* Administrative Location Banner */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B3B60]"></span>
            <span>स्थान: <strong className="text-[#0B3B60]">{settings?.ward_village_name || 'ग्राम सेट करें'}</strong></span>
            <span className="text-slate-300 hidden xs:inline">|</span>
            <span className="text-[#0B3B60] font-black bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {activeSectionName}
            </span>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            जिला: <strong className="text-slate-800">{settings?.district_name || 'मथुरा'}</strong> | ब्लॉक: <strong className="text-slate-800">{settings?.tehsil_block || 'मथुरा'}</strong> | ब्लॉक सं.: <strong className="text-slate-800">{settings?.enumeration_block_no || '001'}</strong>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-xs sm:text-sm font-bold text-[#0B3B60] bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300 transition-all active:scale-95 shadow-sm shrink-0 min-h-[38px]"
        >
          बदलें
        </button>
      </div>

      {/* Feedback & Error Alerts */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 sm:p-3.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 sm:p-3.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 1: भवन, मकान व त्वरित सदस्य सूचीकरण (MEMBERS ROSTER) */}
      {/* ============================================================== */}
      {entryStep === 1 && (
        <div className="space-y-3.5">
          {/* भाग 1: भवन, मकान एवं परिवार क्रमांक */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide flex items-center gap-1.5">
                <Home className="w-4 h-4 text-[#0B3B60]" />
                <span>भाग 1: भवन, मकान एवं परिवार क्रमांक</span>
              </h2>
              <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg font-bold font-mono">
                {activeSectionName}
              </span>
            </div>

            {/* Steppers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* 1. भवन संख्या */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 text-center">
                  भवन संख्या <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustNumber(buildingNo, setBuildingNo, -1)}
                    className="w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                    title="घटाएं (-1)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={buildingNo}
                    onChange={(e) => setBuildingNo(sanitizeAlphanumeric(e.target.value))}
                    className="w-full text-center font-black text-sm sm:text-base text-slate-900 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(buildingNo, setBuildingNo, 1)}
                    className="w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-l border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                    title="बढ़ाएं (+1)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. मकान संख्या */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 text-center">
                  मकान संख्या <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustNumber(censusHouseNo, setCensusHouseNo, -1)}
                    className="w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                    title="घटाएं (-1)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={censusHouseNo}
                    onChange={(e) => setCensusHouseNo(sanitizeAlphanumeric(e.target.value))}
                    className="w-full text-center font-black text-sm sm:text-base text-slate-900 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(censusHouseNo, setCensusHouseNo, 1)}
                    className="w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-l border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                    title="बढ़ाएं (+1)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3. परिवार संख्या */}
              <div className="col-span-2 sm:col-span-1 space-y-1 bg-blue-50/50 p-2 sm:p-0 rounded-xl border sm:border-0 border-blue-200/80">
                <div className="flex items-center justify-between sm:justify-center">
                  <label className="block text-xs sm:text-sm font-bold text-[#0B3B60] text-center">
                    परिवार संख्या <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => adjustNumber(householdNo, setHouseholdNo, 1)}
                    className="sm:hidden text-xs font-bold text-white bg-[#0B3B60] px-2.5 py-0.5 rounded-lg active:scale-95 shadow-xs"
                  >
                    +1 अगला परिवार
                  </button>
                </div>

                <div className="flex items-center border-2 border-[#0B3B60] rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustNumber(householdNo, setHouseholdNo, -1)}
                    className="w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={householdNo}
                    onChange={(e) => setHouseholdNo(sanitizeAlphanumeric(e.target.value))}
                    className="w-full text-center font-black text-base sm:text-lg text-[#0B3B60] py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(householdNo, setHouseholdNo, 1)}
                    className="w-11 h-11 bg-[#0B3B60] hover:bg-[#134D7E] text-white font-bold border-l border-blue-900 active:bg-[#072F5F] transition-colors flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* भाग 2: परिवार के सदस्यों की सूची (ROSTER) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0B3B60]" />
                <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                  भाग 2: सदस्य सूची ({members.length})
                </h2>
              </div>

              {/* Action Buttons for Adding Members */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenQuickAdd}
                  className="flex items-center gap-1 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black shadow-sm active:scale-95 transition-all min-h-[38px]"
                  title="30 सेकंड में सदस्य का बुनियादी विवरण जोड़ें"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>{members.length === 0 ? '+ मुखिया जोड़ें (त्वरित)' : '+ त्वरित सदस्य जोड़ें'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenFullModal(null)}
                  className="flex items-center gap-1 px-3 py-2 bg-[#0B3B60] hover:bg-[#134D7E] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all min-h-[38px]"
                  title="सीधे सम्पूर्ण 40 प्रश्नों का प्रपत्र खोलें"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  <span className="hidden xs:inline">विस्तृत प्रपत्र</span>
                </button>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="p-6 sm:p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 space-y-3">
                <Users className="w-12 h-12 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm sm:text-base font-bold text-slate-800">अभी कोई सदस्य प्रविष्ट नहीं हुआ है</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    त्वरित सूचीकरण का उपयोग करें: 1 मिनट में सभी सदस्यों के नाम, संबंध व उम्र दर्ज करें। संबंध स्वतः लिंक हो जाएंगे!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenQuickAdd}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-black shadow-md active:scale-95 transition-all"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>+ परिवार के मुखिया का विवरण दर्ज करें</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.map((m, idx) => (
                  <div
                    key={m.local_id || idx}
                    className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/30 shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    {/* Left Details */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 font-black text-slate-800 flex items-center justify-center text-sm shrink-0 shadow-inner">
                        {idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm sm:text-base text-slate-900">{m.q1_name}</span>
                          {idx === 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-md border border-amber-300">
                              मुखिया
                            </span>
                          )}
                          <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                            {getRelLabel(m.q2_relationship)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                          <span>{getGenderLabel(m.q3_gender)} ({m.q4b_age} वर्ष)</span>
                          
                          {/* Inferred Relationships Tags */}
                          {Number(m.q5_marital_status) === 2 && (
                            <span className="text-[#0B3B60] font-bold">
                              • पति/पत्नी: {getMemberNameBySerial(m.q7_spouse_serial_no)}
                            </span>
                          )}
                          {m.q11_father_serial_no && (
                            <span className="text-slate-700">
                              • पिता: {getMemberNameBySerial(m.q11_father_serial_no)}
                            </span>
                          )}
                          {m.q12_mother_serial_no && (
                            <span className="text-slate-700">
                              • माता: {getMemberNameBySerial(m.q12_mother_serial_no)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenQuickEdit(idx)}
                        className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 text-xs font-bold"
                        title="बुनियादी विवरण बदलें"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline ml-1">त्वरित</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenFullModal(idx)}
                        className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-[#0B3B60] bg-blue-50 hover:bg-blue-100 border border-blue-200 active:scale-95 text-xs font-bold"
                        title="विस्तृत 40 प्रश्न प्रपत्र भरें"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline ml-1">विस्तृत</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMember(idx)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-slate-200 active:scale-95"
                        title="हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Next Step Button */}
          {members.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-3.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                <div className="text-xs sm:text-sm font-black text-slate-800 shrink-0">
                  परिवार #{householdNo} • {members.length} सदस्य
                </div>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="flex-1 py-3 bg-[#0B3B60] hover:bg-[#134D7E] active:scale-98 text-white font-black text-sm sm:text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px]"
                >
                  <span>अगला चरण: पारिवारिक सारांश व प्रश्न</span>
                  <ArrowRight className="w-5 h-5 text-amber-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: पारिवारिक संबंध समीक्षा एवं संपूर्ण परिवार के प्रश्न */}
      {/* ============================================================== */}
      {entryStep === 2 && (
        <div className="space-y-4">
          
          {/* Section A: पारिवारिक संबंध मैट्रिक्स (RELATIONSHIP MATRIX CONFIRMATION) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#0B3B60]" />
                <span>१. पारिवारिक संबंध समीक्षा (Family Relations Confirmation)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                स्मार्ट इंजन द्वारा संबंध स्वतः निर्धारित किए गए हैं। आवश्यकता पड़ने पर आप नीचे ड्रॉपडाउन से बदल सकते हैं:
              </p>
            </div>

            <div className="space-y-3">
              {members.map((m, idx) => {
                const potentialSpouses = getMemberDropdownOptions(members, m.serial_no);
                const potentialFathers = members.filter((f) => f.serial_no !== m.serial_no && Number(f.q3_gender) === 1);
                const potentialMothers = members.filter((mot) => mot.serial_no !== m.serial_no && Number(mot.q3_gender) === 2);

                return (
                  <div key={m.serial_no} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-extrabold text-sm text-slate-900">
                        {m.serial_no}. {m.q1_name} ({getRelLabel(m.q2_relationship)}, {m.q4b_age} वर्ष)
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {m.q5_marital_status === 2 ? 'विवाहित' : 'अविवाहित/अन्य'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Spouse Selector */}
                      {Number(m.q5_marital_status) === 2 ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">जीवनसाथी</label>
                          <select
                            value={m.q7_spouse_serial_no || '00'}
                            onChange={(e) => handleUpdateRelation(idx, 'q7_spouse_serial_no', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                          >
                            <option value="00">00 - परिवार से बाहर / नहीं</option>
                            {potentialSpouses.map((s) => (
                              <option key={s.serial_no} value={s.serial_no}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-medium py-2">
                          जीवनसाथी: लागू नहीं (अविवाहित)
                        </div>
                      )}

                      {/* Father Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">पिता</label>
                        <select
                          value={m.q11_father_serial_no || '00'}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateRelation(idx, 'q11_father_serial_no', val === '00' ? null : Number(val));
                            handleUpdateRelation(idx, 'q11_father_in_hh', val !== '00');
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                        >
                          <option value="00">00 - परिवार से बाहर / मृत</option>
                          {potentialFathers.map((f) => (
                            <option key={f.serial_no} value={f.serial_no}>
                              {f.serial_no} - {f.q1_name} ({f.q4b_age} वर्ष)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mother Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">माता</label>
                        <select
                          value={m.q12_mother_serial_no || '00'}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateRelation(idx, 'q12_mother_serial_no', val === '00' ? null : Number(val));
                            handleUpdateRelation(idx, 'q12_mother_in_hh', val !== '00');
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                        >
                          <option value="00">00 - परिवार से बाहर / मृत</option>
                          {potentialMothers.map((mot) => (
                            <option key={mot.serial_no} value={mot.serial_no}>
                              {mot.serial_no} - {mot.q1_name} ({mot.q4b_age} वर्ष)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: परिवार-स्तरीय सामान्य प्रश्न (HOUSEHOLD-WIDE COMMON QUESTIONS) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                २. परिवार-स्तरीय सामान्य प्रश्न (Household Shared Details)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                यहाँ सेट किए गए धर्म, संवर्ग व भाषा स्वतः सभी सदस्यों पर लागू हो जाएँगे:
              </p>
            </div>

            {/* 1. परिवार का प्रकार */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                परिवार का प्रकार <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {HOUSEHOLD_TYPE_CODES.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setHouseholdType(t.code)}
                    className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      householdType === t.code
                        ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. परिवार का मुख्य धर्म */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                परिवार का मुख्य धर्म <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {RELIGION_CODES.map((rel) => (
                  <button
                    key={rel.code}
                    type="button"
                    onClick={() => setHhReligion(rel.code)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      hhReligion === rel.code
                        ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {rel.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. सामाजिक संवर्ग व जाति */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                परिवार का सामाजिक संवर्ग (SC / ST / सामान्य / अन्य) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 3, label: 'सामान्य / अन्य (General)' },
                  { code: 1, label: 'अनुसूचित जाति (SC)' },
                  { code: 2, label: 'अनुसूचित जनजाति (ST)' }
                ].map((cat) => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setHhSocialCategory(cat.code)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      hhSocialCategory === cat.code
                        ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={hhCasteName}
                onChange={(e) => setHhCasteName(sanitizeText(e.target.value))}
                placeholder="जाति का नाम दर्ज करें (उदा. ब्राह्मण, जाट, यादव, आदि)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-white"
              />
            </div>

            {/* 4. मातृभाषा */}
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                परिवार की मातृभाषा
              </label>
              <input
                type="text"
                value={hhMotherTongue}
                onChange={(e) => setHhMotherTongue(sanitizeText(e.target.value))}
                placeholder="हिन्दी"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-white"
              />
            </div>

            {/* 5. प्रपत्र स्थिति एवं रिमार्क्स */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs sm:text-sm font-bold text-slate-800">सर्वेक्षण प्रपत्र की स्थिति</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('completed')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      status === 'completed'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    पूर्ण (Completed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      status === 'draft'
                        ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    अपूर्ण (Draft)
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="रिमार्क्स अथवा विशेष विवरण (वैकल्पिक)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-[#0B3B60]/20"
              />
            </div>

          </div>

          {/* Sticky Bottom Actions in Step 2 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-3.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEntryStep(1)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 flex items-center gap-1.5 min-h-[48px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>पिछला</span>
              </button>

              <button
                type="button"
                onClick={handleSaveHousehold}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm sm:text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <Save className="w-5 h-5 text-amber-300" />
                <span>संपूर्ण परिवार प्रपत्र सुरक्षित करें</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Quick Add Modal */}
      <QuickMemberModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        onSave={handleSaveQuickMember}
        serialNo={activeMemberIndex !== null ? activeMemberIndex + 1 : members.length + 1}
        existingMember={activeMemberIndex !== null ? members[activeMemberIndex] : null}
        householdMembers={members}
      />

      {/* Full 40-Q Member Modal */}
      <MemberModal
        isOpen={isFullModalOpen}
        onClose={() => setIsFullModalOpen(false)}
        onSave={handleSaveFullMember}
        serialNo={activeMemberIndex !== null ? activeMemberIndex + 1 : members.length + 1}
        existingMember={activeMemberIndex !== null ? members[activeMemberIndex] : null}
        headMember={members.length > 0 ? members[0] : null}
        householdMembers={members}
      />

    </div>
  );
}
