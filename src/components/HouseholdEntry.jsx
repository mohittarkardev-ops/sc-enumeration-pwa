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
  Plus
} from 'lucide-react';
import { db } from '../db/db';
import { HOUSEHOLD_TYPE_CODES, RELATIONSHIP_CODES, GENDER_CODES } from '../constants/censusCodes';
import MemberModal from './MemberModal';
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
  const [currentLocalId, setCurrentLocalId] = useState(null);
  const [buildingNo, setBuildingNo] = useState(settings?.last_building_no || '001');
  const [censusHouseNo, setCensusHouseNo] = useState(settings?.last_census_house_no || '001');
  const [householdNo, setHouseholdNo] = useState(settings?.last_household_no || '001');
  const [householdType, setHouseholdType] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('completed');

  const [members, setMembers] = useState([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Find active section name
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
      setMembers(editingMembers || []);
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

  const handleOpenAddMember = () => {
    setFormError('');
    setEditingMemberIndex(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (index) => {
    setFormError('');
    setEditingMemberIndex(index);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = (index) => {
    if (confirm('क्या आप इस सदस्य की प्रविष्टि हटाना चाहते हैं?')) {
      const updated = members.filter((_, i) => i !== index).map((m, idx) => ({
        ...m,
        serial_no: idx + 1
      }));
      setMembers(updated);
    }
  };

  const handleSaveMemberFromModal = (memberData) => {
    if (editingMemberIndex !== null) {
      const updated = [...members];
      updated[editingMemberIndex] = memberData;
      setMembers(updated);
    } else {
      setMembers([...members, memberData]);
    }
    setIsMemberModalOpen(false);
  };

  const handleSaveHousehold = async () => {
    setFormError('');

    if (members.length === 0) {
      setFormError('प्रपत्र सुरक्षित करने हेतु कम से कम परिवार के मुखिया (क्र.सं. 1) का विवरण जोड़ना अनिवार्य है।');
      return;
    }

    const cleanBuilding = sanitizeAlphanumeric(buildingNo);
    const cleanHouse = sanitizeAlphanumeric(censusHouseNo);
    const cleanHousehold = sanitizeAlphanumeric(householdNo);

    if (!cleanBuilding || !cleanHouse || !cleanHousehold) {
      setFormError('कृपया भवन सं., जनगणना मकान सं. एवं परिवार संख्या दर्ज करें।');
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
      village_section: activeSection,
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

    for (const mem of members) {
      const memberRecord = {
        ...mem,
        household_local_id: householdLocalId,
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

    setFeedbackMsg(`परिवार क्रमांक ${householdRecord.household_no} का प्रपत्र सफलतापूर्वक सुरक्षित हुआ।`);
    setTimeout(() => setFeedbackMsg(''), 4500);

    if (navigator.onLine) {
      syncPendingData();
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

      {/* Administrative Location Banner with Soft Rounded Corners */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B3B60]"></span>
            <span>स्थान: {settings?.ward_village_name || 'ग्राम सेट करें'}</span>
            <span className="text-slate-300 hidden xs:inline">|</span>
            <span className="text-[#0B3B60] font-black bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {activeSectionName}
            </span>
          </div>
          <div className="text-xs text-slate-600 font-medium leading-relaxed">
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

      {/* SECTION 1: भवन, मकान एवं परिवार क्रमांक - High Legibility Steppers */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide flex items-center gap-1.5">
            <Home className="w-4 h-4 text-[#0B3B60]" />
            <span>भाग 1: भवन, मकान एवं परिवार क्रमांक विवरण</span>
          </h2>
          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg font-bold font-mono">
            {activeSectionName}
          </span>
        </div>

        {/* 3 Horizontal Touch Steppers [-] [Input] [+] */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          
          {/* 1. भवन संख्या */}
          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 text-center">
              भवन संख्या <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#0B3B60]/20 focus-within:border-[#0B3B60]">
              <button
                type="button"
                onClick={() => adjustNumber(buildingNo, setBuildingNo, -1)}
                className="w-10 sm:w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
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
                className="w-10 sm:w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-l border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                title="बढ़ाएं (+1)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. जनगणना मकान संख्या */}
          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 text-center">
              मकान संख्या <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#0B3B60]/20 focus-within:border-[#0B3B60]">
              <button
                type="button"
                onClick={() => adjustNumber(censusHouseNo, setCensusHouseNo, -1)}
                className="w-10 sm:w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
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
                className="w-10 sm:w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-l border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                title="बढ़ाएं (+1)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. परिवार संख्या (पूर्ण संपादन योग्य) */}
          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-bold text-[#0B3B60] text-center">
              परिवार संख्या <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center border-2 border-[#0B3B60] rounded-xl overflow-hidden bg-blue-50/20 shadow-sm focus-within:ring-2 focus-within:ring-[#0B3B60]/30">
              <button
                type="button"
                onClick={() => adjustNumber(householdNo, setHouseholdNo, -1)}
                className="w-10 sm:w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 active:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                title="घटाएं (-1)"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={householdNo}
                onChange={(e) => setHouseholdNo(sanitizeAlphanumeric(e.target.value))}
                className="w-full text-center font-black text-sm sm:text-base text-[#0B3B60] py-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => adjustNumber(householdNo, setHouseholdNo, 1)}
                className="w-10 sm:w-11 h-11 bg-[#0B3B60] hover:bg-[#134D7E] text-white font-bold border-l border-blue-900 active:bg-[#072F5F] transition-colors flex items-center justify-center shrink-0"
                title="बढ़ाएं (+1)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* परिवार का प्रकार */}
        <div className="pt-1">
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
            परिवार का प्रकार <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {HOUSEHOLD_TYPE_CODES.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => setHouseholdType(t.code)}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[42px] ${
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
      </div>

      {/* SECTION 2: परिवार के सदस्य - MOBILE MEMBER PROFILE CARDS */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0B3B60]" />
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
              भाग 2: सदस्यों की विवरणी ({members.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMember}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#0B3B60] hover:bg-[#134D7E] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all min-h-[38px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>{members.length === 0 ? '+ मुखिया जोड़ें (क्र. 1)' : '+ सदस्य जोड़ें'}</span>
          </button>
        </div>

        {members.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/60 space-y-2">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">अभी कोई सदस्य प्रविष्ट नहीं किया गया है</p>
            <p className="text-xs text-slate-500">
              कृपया सबसे पहले परिवार के मुखिया का विवरण (क्र.सं. 1) दर्ज करें।
            </p>
            <button
              type="button"
              onClick={handleOpenAddMember}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0B3B60] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ मुखिया का विवरण दर्ज करें</span>
            </button>
          </div>
        ) : (
          /* Mobile Thumb-Friendly Member Census Cards */
          <div className="space-y-2.5">
            {members.map((m, idx) => (
              <div 
                key={m.local_id || idx}
                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 shadow-sm transition-all flex items-center justify-between gap-3"
              >
                {/* Left: Serial Badge + Details */}
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
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-2">
                      <span>{getRelLabel(m.q2_relationship)}</span>
                      <span>•</span>
                      <span>{getGenderLabel(m.q3_gender)} ({m.q4b_age} वर्ष)</span>
                    </div>

                    {/* Contact & ID Pills */}
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 pt-0.5 flex-wrap">
                      {m.q36_mobile_number ? (
                        <span className="flex items-center gap-1 text-slate-700 font-mono font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {m.q36_mobile_number}
                        </span>
                      ) : null}
                      {m.q37_aadhaar_number && m.q37_aadhaar_number !== 'नहीं' ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-mono font-semibold">
                          <CreditCard className="w-3 h-3 text-emerald-600" />
                          आधार उपलब्ध
                        </span>
                      ) : (
                        <span className="text-slate-400">आधार: शेष</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditMember(idx)}
                    className="p-2.5 rounded-xl text-[#0B3B60] hover:bg-slate-100 border border-slate-200 active:scale-95 transition-all shadow-sm min-h-[42px] min-w-[42px] flex items-center justify-center"
                    title="संशोधन करें"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(idx)}
                    className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-slate-200 active:scale-95 transition-all shadow-sm min-h-[42px] min-w-[42px] flex items-center justify-center"
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

      {/* प्रपत्र स्थिति एवं रिमार्क्स */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs sm:text-sm font-bold text-slate-800">सर्वेक्षण प्रपत्र की स्थिति</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[38px] ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[38px] ${
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
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
        />

        {/* Local DB Security Badge */}
        <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% ऑफ़लाइन सुरक्षित (फोन की लोकल मेमोरी में संगृहीत)
          </span>
          <span className="font-semibold">{members.length} सदस्य प्रविष्ट</span>
        </div>
      </div>

      {/* Sticky Bottom Bar with Comfortable Tap Size */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-3.5 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-black text-slate-800 shrink-0">
            परिवार #{householdNo} • {members.length} सदस्य
          </div>

          <button
            type="button"
            onClick={handleSaveHousehold}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm sm:text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px]"
          >
            <Save className="w-5 h-5" />
            <span>परिवार प्रपत्र सुरक्षित करें</span>
          </button>
        </div>
      </div>

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMemberFromModal}
        serialNo={editingMemberIndex !== null ? editingMemberIndex + 1 : members.length + 1}
        existingMember={editingMemberIndex !== null ? members[editingMemberIndex] : null}
        headMember={members.length > 0 ? members[0] : null}
        householdMembers={members}
      />
    </div>
  );
}
