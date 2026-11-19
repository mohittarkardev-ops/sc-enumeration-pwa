import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Users, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Edit,
  FolderOpen
} from 'lucide-react';
import { db } from '../db/db';
import { exportAllDataToExcel } from '../utils/exportExcel';

export default function HouseholdListView({ activeSection, onNewEntry, onEditHousehold }) {
  const [households, setHouseholds] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHhId, setExpandedHhId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const hhList = await db.households
        .where('village_section')
        .equals(activeSection)
        .reverse()
        .sortBy('created_at');
      setHouseholds(hhList);

      const memList = await db.members.toArray();
      setMembers(memList);
    } catch (err) {
      console.warn('Error loading household registry:', err);
    }
  }, [activeSection]);

  useEffect(() => {
    loadData();
    // Gentle refresh when window is focused or every 10 seconds (no battery/CPU lag)
    window.addEventListener('focus', loadData);
    const interval = setInterval(loadData, 10000);
    return () => {
      window.removeEventListener('focus', loadData);
      clearInterval(interval);
    };
  }, [loadData]);

  const handleDeleteHousehold = async (localId) => {
    if (confirm('क्या आप इस परिवार और इसके सभी सदस्यों का संपूर्ण रिकॉर्ड हटाना चाहते हैं?')) {
      await db.households.delete(localId);
      await db.members.where('household_local_id').equals(localId).delete();
      loadData();
    }
  };

  const filteredHouseholds = households.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      (h.head_name && h.head_name.toLowerCase().includes(q)) ||
      (h.household_no && h.household_no.includes(q)) ||
      (h.census_house_no && h.census_house_no.includes(q)) ||
      (h.building_no && h.building_no.includes(q))
    );
  });

  return (
    <div className="p-3 sm:p-4 max-w-2xl mx-auto space-y-3.5 pb-24 font-['Hind'] text-sm">
      
      {/* Official Registry Stats Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
              ग्राम प्रभाग {activeSection} — परिवार पंजिका (Household Roster)
            </h2>
            <div className="text-xs text-slate-600 font-medium mt-0.5">
              पंजीकृत परिवार: <strong className="text-slate-900">{households.length}</strong> | कुल सदस्य संख्या: <strong className="text-slate-900">{members.filter(m => households.some(h => h.local_id === m.household_local_id)).length}</strong>
            </div>
          </div>

          <button
            onClick={exportAllDataToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all min-h-[38px]"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Excel एक्सपोर्ट</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="मुखिया का नाम, परिवार संख्या या मकान संख्या से खोजें..."
            className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
          />
        </div>
      </div>

      {/* Household Records List */}
      {filteredHouseholds.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">कोई प्रविष्टि प्राप्त नहीं हुई</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'सर्च फ़िल्टर के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।' : `भाग ${activeSection} में अभी तक कोई परिवार दर्ज नहीं हुआ है।`}
          </p>
          <button
            onClick={onNewEntry}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0B3B60] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#134D7E] active:scale-95"
          >
            + नया परिवार प्रपत्र भरें
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHouseholds.map((h) => {
            const isExpanded = expandedHhId === h.local_id;
            const hhMembers = members.filter((m) => m.household_local_id === h.local_id);

            return (
              <div
                key={h.local_id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Main Summary Row */}
                <div
                  onClick={() => setExpandedHhId(isExpanded ? null : h.local_id)}
                  className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-11 px-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[10px] text-slate-500 font-bold uppercase leading-none">परिवार</span>
                      <span className="text-sm sm:text-base font-black text-[#0B3B60] leading-tight">
                        #{h.household_no}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {h.head_name || 'मुखिया अज्ञात'}
                        </span>
                        {h.status === 'draft' && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-300">
                            अपूर्ण
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                        मकान सं.: <strong className="text-slate-800">{h.census_house_no}</strong> | भवन: <strong className="text-slate-800">{h.building_no}</strong> | कुल सदस्य: <strong className="text-slate-800">{h.total_members}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Sync Status Badge */}
                    {h.sync_status === 'synced' ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden xs:inline">समन्वित</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden xs:inline">लोकल DB</span>
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Actions */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-3.5 space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        सदस्य विवरणी तालिका ({hhMembers.length}):
                      </span>

                      {/* Open / Edit Household Button */}
                      {onEditHousehold && (
                        <button
                          type="button"
                          onClick={() => onEditHousehold(h, hhMembers)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B3B60] hover:bg-[#134D7E] text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 min-h-[36px]"
                        >
                          <FolderOpen className="w-4 h-4 text-amber-300" />
                          <span>प्रपत्र खोलें व संपादित करें</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-2.5 text-center w-10">क्र.</th>
                            <th className="py-2 px-2.5">नाम</th>
                            <th className="py-2 px-2.5 text-center">आयु/लिंग</th>
                            <th className="py-2 px-2.5">सम्पर्क / आधार</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                          {hhMembers.map((m, idx) => (
                            <tr key={m.local_id || idx} className="hover:bg-slate-50/60">
                              <td className="py-2 px-2.5 text-center font-black text-slate-700">
                                {m.serial_no}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-slate-900">
                                {m.q1_name}
                              </td>
                              <td className="py-2 px-2.5 text-center text-slate-600">
                                {m.q4b_age} वर्ष / {m.q3_gender === 1 ? 'पु.' : m.q3_gender === 2 ? 'महि.' : 'अन्य'}
                              </td>
                              <td className="py-2 px-2.5 text-slate-600 font-mono text-xs">
                                {m.q36_mobile_number || 'मो. शेष'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 flex-wrap gap-2">
                      <span className="text-xs text-slate-500">
                        प्रविष्टि समय: {new Date(h.created_at).toLocaleString('hi-IN')}
                      </span>
                      <button
                        onClick={() => handleDeleteHousehold(h.local_id)}
                        className="text-red-700 hover:text-red-900 flex items-center gap-1 text-xs sm:text-sm font-bold min-h-[36px]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>प्रपत्र निरस्त करें</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
