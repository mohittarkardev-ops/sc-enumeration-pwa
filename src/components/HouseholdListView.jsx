import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Download, 
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { db } from '../db/db';
import { exportAllDataToExcel } from '../utils/exportExcel';

export default function HouseholdListView({ activeSection, onNewEntry }) {
  const [households, setHouseholds] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHhId, setExpandedHhId] = useState(null);

  const loadData = async () => {
    const hhList = await db.households
      .where('village_section')
      .equals(activeSection)
      .reverse()
      .sortBy('created_at');
    setHouseholds(hhList);

    const memList = await db.members.toArray();
    setMembers(memList);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [activeSection]);

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
    <div className="p-3 max-w-2xl mx-auto space-y-3 pb-20 font-['Hind']">
      
      {/* Official Registry Stats Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-xs font-bold text-[#0B3B60] uppercase tracking-wide">
              ग्राम भाग / सेक्शन {activeSection} — पंजीकृत परिवार पंजिका
            </h2>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              कुल पंजीकृत परिवार: <strong className="text-slate-900">{households.length}</strong> | कुल सदस्य संख्या: <strong className="text-slate-900">{members.filter(m => households.some(h => h.local_id === m.household_local_id)).length}</strong>
            </div>
          </div>

          <button
            onClick={exportAllDataToExcel}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel एक्सपोर्ट</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="मुखिया का नाम, परिवार संख्या या मकान संख्या से खोजें..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3B60]"
          />
        </div>
      </div>

      {/* Household Records List */}
      {filteredHouseholds.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-slate-300 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-800">कोई प्रविष्टि प्राप्त नहीं हुई</p>
          <p className="text-[11px] text-slate-500">
            {searchQuery ? 'सर्च फ़िल्टर के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।' : `सेक्शन ${activeSection} में अभी तक कोई परिवार दर्ज नहीं हुआ है।`}
          </p>
          <button
            onClick={onNewEntry}
            className="mt-2 px-4 py-2 bg-[#0B3B60] text-white rounded text-xs font-bold shadow-sm hover:bg-[#134D7E]"
          >
            + नया परिवार प्रपत्र भरें
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHouseholds.map((h) => {
            const isExpanded = expandedHhId === h.local_id;
            const hhMembers = members.filter((m) => m.household_local_id === h.local_id);

            return (
              <div
                key={h.local_id}
                className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden"
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedHhId(isExpanded ? null : h.local_id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded border border-slate-300 bg-slate-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase leading-none">परिवार</span>
                      <span className="text-xs font-extrabold text-[#0B3B60] leading-tight">
                        #{h.household_no}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {h.head_name || 'मुखिया अज्ञात'}
                        </span>
                        {h.status === 'draft' && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-300">
                            अपूर्ण
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        मकान सं.: <strong>{h.census_house_no}</strong> | भवन: <strong>{h.building_no}</strong> | कुल सदस्य: <strong>{h.total_members}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sync Status Badge */}
                    {h.sync_status === 'synced' ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        सिंक पूर्ण
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-bold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        लोकल DB
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Household Members List */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      सदस्य विवरणी:
                    </div>
                    
                    <div className="border border-slate-200 rounded overflow-hidden bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-2 text-center w-8">क्र.</th>
                            <th className="py-1.5 px-2">नाम</th>
                            <th className="py-1.5 px-2 text-center">आयु/लिंग</th>
                            <th className="py-1.5 px-2">सम्पर्क / आधार</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {hhMembers.map((m, idx) => (
                            <tr key={m.local_id || idx}>
                              <td className="py-1.5 px-2 text-center font-bold text-slate-700">
                                {m.serial_no}
                              </td>
                              <td className="py-1.5 px-2 font-bold text-slate-900">
                                {m.q1_name}
                              </td>
                              <td className="py-1.5 px-2 text-center text-slate-600">
                                {m.q4b_age} वर्ष / {m.q3_gender === 1 ? 'पु.' : m.q3_gender === 2 ? 'महि.' : 'ट्रांस'}
                              </td>
                              <td className="py-1.5 px-2 text-slate-600 font-mono text-[10px]">
                                मो: {m.q36_mobile_number || 'उपलब्ध नहीं'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                      <span className="text-[10px] text-slate-500">
                        प्रविष्टि समय: {new Date(h.created_at).toLocaleString('hi-IN')}
                      </span>
                      <button
                        onClick={() => handleDeleteHousehold(h.local_id)}
                        className="text-red-700 hover:text-red-900 flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
