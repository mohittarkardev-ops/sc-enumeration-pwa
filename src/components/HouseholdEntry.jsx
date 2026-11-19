import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Home, 
  Users, 
  Save, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { db } from '../db/db';
import { HOUSEHOLD_TYPE_CODES, RELATIONSHIP_CODES, GENDER_CODES, MARITAL_STATUS_CODES } from '../constants/censusCodes';
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
  onHouseholdSaved
}) {
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

  useEffect(() => {
    if (settings) {
      if (settings.last_building_no) setBuildingNo(settings.last_building_no);
      if (settings.last_census_house_no) setCensusHouseNo(settings.last_census_house_no);
      if (settings.last_household_no) setHouseholdNo(settings.last_household_no);
    }
  }, [settings]);

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
        serial_no: idx + 1,
        q2_relationship: idx === 0 ? 1 : m.q2_relationship
      }));
      setMembers(updated);
    }
  };

  const handleSaveMemberFromModal = (memberData) => {
    if (editingMemberIndex !== null) {
      const updated = [...members];
      updated[editingMemberIndex] = {
        ...memberData,
        serial_no: editingMemberIndex + 1
      };
      setMembers(updated);
    } else {
      const updated = [
        ...members,
        {
          ...memberData,
          local_id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          serial_no: members.length + 1
        }
      ];
      setMembers(updated);
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

    const householdLocalId = 'hh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save in IndexedDB
    await db.households.put(householdRecord);

    for (const mem of members) {
      const memberRecord = {
        ...mem,
        household_local_id: householdLocalId,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await db.members.put(memberRecord);
    }

    // Auto increment household number based on current entered number
    const nextHhNum = pad3(parseInt(cleanHousehold, 10) + 1);
    setHouseholdNo(nextHhNum);

    await db.settings.update('active_settings', {
      last_building_no: cleanBuilding,
      last_census_house_no: cleanHouse,
      last_household_no: nextHhNum
    });

    setMembers([]);
    setRemarks('');

    setFeedbackMsg(`परिवार संख्या ${householdRecord.household_no} का प्रपत्र सफलतापूर्वक सुरक्षित किया गया।`);
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
    <div className="p-3 max-w-2xl mx-auto space-y-3 pb-24 font-['Hind']">
      
      {/* Official Administrative Location Banner */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B3B60]"></span>
            <span>स्थान: {settings?.ward_village_name || 'ग्राम का नाम सेट करें'}</span>
            <span className="text-slate-400">|</span>
            <span className="text-[#0B3B60] font-extrabold">भाग / सेक्शन {activeSection}</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium">
            जिला: <strong className="text-slate-800">{settings?.district_name || 'मथुरा'}</strong> | ब्लॉक/तहसील: <strong className="text-slate-800">{settings?.tehsil_block || 'मथुरा'}</strong> | गणना ब्लॉक: <strong className="text-slate-800">{settings?.enumeration_block_no || '001'}</strong>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-xs font-bold text-[#0B3B60] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300 transition-all active:scale-95"
        >
          स्थान बदलें
        </button>
      </div>

      {/* Alerts */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: भवन, मकान एवं परिवार पहचान संख्या */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-xs font-bold text-[#0B3B60] uppercase tracking-wide flex items-center gap-1.5">
            <Home className="w-4 h-4 text-[#0B3B60]" />
            <span>भाग 1: भवन, मकान एवं परिवार क्रमांक विवरण</span>
          </h2>
          <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-700 px-2 py-0.5 rounded font-bold font-mono">
            सेक्शन {activeSection}
          </span>
        </div>

        {/* 3 Numeric Fields Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* भवन संख्या */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-800 text-center">
              भवन संख्या <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center border border-slate-300 rounded bg-white shadow-inner">
              <input
                type="text"
                value={buildingNo}
                onChange={(e) => setBuildingNo(sanitizeAlphanumeric(e.target.value))}
                className="w-full text-center font-bold text-sm text-slate-900 py-1.5 bg-transparent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => adjustNumber(buildingNo, setBuildingNo, -1)}
                className="py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustNumber(buildingNo, setBuildingNo, 1)}
                className="py-1 rounded bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold text-xs"
              >
                +1
              </button>
            </div>
          </div>

          {/* जनगणना मकान संख्या */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-800 text-center">
              मकान संख्या <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center border border-slate-300 rounded bg-white shadow-inner">
              <input
                type="text"
                value={censusHouseNo}
                onChange={(e) => setCensusHouseNo(sanitizeAlphanumeric(e.target.value))}
                className="w-full text-center font-bold text-sm text-slate-900 py-1.5 bg-transparent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => adjustNumber(censusHouseNo, setCensusHouseNo, -1)}
                className="py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustNumber(censusHouseNo, setCensusHouseNo, 1)}
                className="py-1 rounded bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold text-xs"
              >
                +1
              </button>
            </div>
          </div>

          {/* परिवार संख्या */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#0B3B60] text-center">
              परिवार संख्या <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center border-2 border-[#0B3B60] rounded bg-blue-50/30 shadow-inner">
              <input
                type="text"
                value={householdNo}
                onChange={(e) => setHouseholdNo(sanitizeAlphanumeric(e.target.value))}
                className="w-full text-center font-extrabold text-sm text-[#0B3B60] py-1.5 bg-transparent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => adjustNumber(householdNo, setHouseholdNo, -1)}
                className="py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustNumber(householdNo, setHouseholdNo, 1)}
                className="py-1 rounded bg-[#0B3B60] hover:bg-[#134D7E] text-white font-bold text-xs"
              >
                +1
              </button>
            </div>
          </div>
        </div>

        {/* परिवार का प्रकार */}
        <div className="pt-1">
          <label className="block text-[11px] font-bold text-slate-800 mb-1">
            परिवार का प्रकार <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {HOUSEHOLD_TYPE_CODES.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => setHouseholdType(t.code)}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition-all ${
                  householdType === t.code
                    ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: परिवार के सदस्यों की विवरणी */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0B3B60]" />
            <h2 className="text-xs font-bold text-[#0B3B60] uppercase tracking-wide">
              भाग 2: परिवार के सदस्यों की विवरणी ({members.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMember}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#0B3B60] hover:bg-[#134D7E] text-white rounded text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{members.length === 0 ? '+ मुखिया जोड़ें (क्र. 1)' : '+ सदस्य जोड़ें'}</span>
          </button>
        </div>

        {members.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded bg-slate-50/50 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">अभी कोई सदस्य प्रविष्ट नहीं किया गया है</p>
            <p className="text-[11px] text-slate-500">
              कृपया सबसे पहले परिवार के मुखिया का विवरण (क्र.सं. 1) दर्ज करें।
            </p>
            <button
              type="button"
              onClick={handleOpenAddMember}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B3B60] text-white rounded text-xs font-bold shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ मुखिया का विवरण दर्ज करें</span>
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-[11px] text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-2 px-2.5 w-10 text-center">क्र.</th>
                  <th className="py-2 px-2.5">नाम</th>
                  <th className="py-2 px-2.5">सम्बन्ध</th>
                  <th className="py-2 px-2 text-center">लिंग/आयु</th>
                  <th className="py-2 px-2 text-center">क्रियाएं</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((m, idx) => (
                  <tr key={m.local_id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2.5 text-center font-bold font-mono text-slate-800">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-bold text-slate-900">{m.q1_name}</div>
                      {idx === 0 && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300 inline-block mt-0.5">
                          मुखिया
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 font-medium">
                      {getRelLabel(m.q2_relationship)}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-700 font-medium whitespace-nowrap">
                      {getGenderLabel(m.q3_gender)} / {m.q4b_age} वर्ष
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMember(idx)}
                          className="p-1 text-[#0B3B60] hover:bg-slate-200 rounded"
                          title="संशोधन करें"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(idx)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* प्रपत्र स्थिति एवं रिमार्क्स */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">सर्वेक्षण प्रपत्र की स्थिति</label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatus('completed')}
              className={`px-3 py-1 rounded text-xs font-bold border ${
                status === 'completed'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              पूर्ण (Completed)
            </button>
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`px-3 py-1 rounded text-xs font-bold border ${
                status === 'draft'
                  ? 'bg-amber-400 text-slate-900 border-amber-500'
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
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
        />
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-300 p-3 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-800">
            परिवार क्रमांक #{householdNo} • {members.length} सदस्य दर्ज
          </div>

          <button
            type="button"
            onClick={handleSaveHousehold}
            className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm rounded shadow flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>परिवार प्रपत्र सुरक्षित करें (0.01s)</span>
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
      />
    </div>
  );
}
