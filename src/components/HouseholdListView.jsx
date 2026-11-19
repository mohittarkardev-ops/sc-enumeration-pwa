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
  FolderOpen,
  RefreshCw,
  CloudDownload,
  Plus,
  Edit3,
  Phone,
  Layers,
  MapPin
} from 'lucide-react';
import { db } from '../db/db';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { syncPendingData } from '../db/supabase';

export default function HouseholdListView({ activeSection, onNewEntry, onEditHousehold }) {
  const [allHouseholds, setAllHouseholds] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHhId, setExpandedHhId] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState('');
  const [sectionFilter, setSectionFilter] = useState(activeSection || 'all');
  const [sectionsList, setSectionsList] = useState([]);

  // Load all households, members, and dynamic sections from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const hhs = await db.households.toArray();
      // Sort newest first
      hhs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setAllHouseholds(hhs);

      const memList = await db.members.toArray();
      setMembers(memList);

      const settings = await db.settings.get('active_settings');
      let baseSections = settings && settings.sections && settings.sections.length > 0
        ? [...settings.sections]
        : [
            { id: '1', name: 'सेक्शन 1' },
            { id: '2', name: 'सेक्शन 2' },
            { id: '3', name: 'सेक्शन 3' }
          ];

      // Auto-discover any custom sections present in households
      const hhSections = Array.from(new Set(hhs.map((h) => String(h.village_section || '').trim()).filter(Boolean)));
      for (const hs of hhSections) {
        const exists = baseSections.some((s) => s.id === hs || s.name === hs || `सेक्शन ${s.id}` === hs);
        if (!exists) {
          baseSections.push({ id: hs, name: hs.startsWith('सेक्शन') ? hs : `सेक्शन ${hs}` });
        }
      }
      setSectionsList(baseSections);
    } catch (err) {
      console.warn('Error loading household registry:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    window.addEventListener('census_settings_updated', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
      window.removeEventListener('census_settings_updated', loadData);
    };
  }, [loadData]);

  // Synchronize section filter when activeSection prop changes from Header
  useEffect(() => {
    if (activeSection) {
      setSectionFilter(activeSection);
    }
  }, [activeSection]);

  // One-time startup auto-pull if local DB is empty
  useEffect(() => {
    if (navigator.onLine && allHouseholds.length === 0) {
      syncPendingData()
        .then((res) => {
          if (res.success && (res.downloadedHhCount > 0 || res.totalRemoteHhs > 0)) {
            loadData();
          }
        })
        .catch((e) => console.warn('Auto-pull notice:', e));
    }
  }, []);

  const handleManualSync = async () => {
    if (isPulling) return;
    setIsPulling(true);
    setPullMsg('क्लाउड से डेटा डाउनलोड व समन्वयित हो रहा है...');
    try {
      const res = await syncPendingData();
      setPullMsg(res.message);
      if (res.updatedSettings && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('census_settings_updated', { detail: res.updatedSettings }));
      }
      await loadData();
    } catch (err) {
      setPullMsg('सिंक विफलता: ' + (err.message || err));
    } finally {
      setIsPulling(false);
      setTimeout(() => setPullMsg(''), 7000);
    }
  };

  const handleDeleteHousehold = async (localId) => {
    if (confirm('क्या आप इस परिवार और इसके सभी सदस्यों का संपूर्ण रिकॉर्ड हटाना चाहते हैं?')) {
      await db.households.delete(localId);
      await db.members.where('household_local_id').equals(localId).delete();
      loadData();
    }
  };

  // Safe section matching (handles '1', 1, 'सेक्शन 1', custom names like 'यादव टोला')
  const matchesSection = (h, filter) => {
    if (!filter || filter === 'all') return true;
    const sec = String(h.village_section || '').trim();
    const target = String(filter).trim();
    if (sec === target || sec === `सेक्शन ${target}` || sec === `Section ${target}`) return true;
    const secObj = sectionsList.find((s) => s.id === target || s.name === target);
    if (secObj && (sec === secObj.id || sec === secObj.name)) return true;
    return false;
  };

  const filteredHouseholds = allHouseholds.filter((h) => {
    if (!matchesSection(h, sectionFilter)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (h.head_name && h.head_name.toLowerCase().includes(q)) ||
      (h.household_no && String(h.household_no).includes(q)) ||
      (h.census_house_no && String(h.census_house_no).includes(q)) ||
      (h.building_no && String(h.building_no).includes(q)) ||
      (h.remarks && h.remarks.toLowerCase().includes(q))
    );
  });

  // Calculate count per section for badges
  const getSectionCount = (secId) => {
    if (secId === 'all') return allHouseholds.length;
    return allHouseholds.filter((h) => matchesSection(h, secId)).length;
  };

  return (
    <div className="p-3 sm:p-4 max-w-2xl mx-auto space-y-3.5 pb-24 font-['Hind'] text-sm">
      
      {/* Sync feedback notification */}
      {pullMsg && (
        <div className="bg-blue-50 border border-blue-300 text-blue-900 p-3 sm:p-3.5 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
          <span>{pullMsg}</span>
          <button onClick={() => setPullMsg('')} className="text-blue-600 hover:text-black font-black p-1">✕</button>
        </div>
      )}

      {/* Official Registry Header & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#0B3B60] uppercase tracking-wide flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-[#0B3B60]" />
              <span>परिवार पंजिका (Household Roster)</span>
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              दर्ज परिवार: <strong className="text-slate-900 font-bold">{filteredHouseholds.length}</strong> (कुल {allHouseholds.length}) | सदस्य: <strong className="text-slate-900 font-bold">{members.length}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Two-Way Sync / Pull Button */}
            <button
              onClick={handleManualSync}
              disabled={isPulling}
              title="क्लाउड से नए परिवार व सदस्य डाउनलोड करें"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B3B60] border border-blue-200 text-xs sm:text-sm font-extrabold shadow-xs active:scale-95 transition-all min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 text-[#0B3B60] ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'सिंक जारी...' : 'क्लाउड सिंक'}</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={exportAllDataToExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all min-h-[40px]"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span className="hidden xs:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Section Filter Pills with Family Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0 mr-1">
            प्रभाग फ़िल्टर:
          </span>
          
          <button
            type="button"
            onClick={() => setSectionFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all border active:scale-95 flex items-center gap-1 ${
              sectionFilter === 'all'
                ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>सभी प्रभाग</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              sectionFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {allHouseholds.length}
            </span>
          </button>

          {sectionsList.map((sec) => {
            const count = getSectionCount(sec.id);
            const isSelected = sectionFilter === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSectionFilter(sec.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all border active:scale-95 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sec.name}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="मुखिया का नाम, परिवार संख्या या मकान संख्या से खोजें..."
            className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm sm:text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
          />
        </div>
      </div>

      {/* Household Records List */}
      {filteredHouseholds.length === 0 ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <Users className="w-14 h-14 text-slate-300 mx-auto" />
          <div>
            <p className="text-base sm:text-lg font-extrabold text-slate-900">
              {allHouseholds.length === 0 ? 'कोई परिवार दर्ज नहीं है' : 'चयनित प्रभाग में कोई परिवार नहीं मिला'}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {allHouseholds.length === 0
                ? 'यदि आपने मोबाइल फोन से डेटा दर्ज कर क्लाउड पर भेजा है, तो डेटा को इस डिवाइस में डाउनलोड करने हेतु नीचे दिया गया बटन दबाएँ:'
                : `कुल ${allHouseholds.length} परिवार अन्य प्रभागों में दर्ज हैं। सभी देखने हेतु 'सभी प्रभाग' चुनें।`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              onClick={handleManualSync}
              disabled={isPulling}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[46px]"
            >
              <CloudDownload className={`w-5 h-5 ${isPulling ? 'animate-bounce' : ''}`} />
              <span>{isPulling ? 'क्लाउड से डाउनलोड हो रहा है...' : 'क्लाउड से डेटा डाउनलोड करें (Pull Sync)'}</span>
            </button>

            <button
              onClick={onNewEntry}
              className="w-full sm:w-auto px-5 py-3 bg-[#0B3B60] hover:bg-[#134D7E] text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[46px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ नया परिवार प्रपत्र भरें</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
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
                  className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-12 px-2 rounded-xl border border-blue-200 bg-blue-50 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[10px] text-[#0B3B60] font-black uppercase leading-none">परिवार</span>
                      <span className="text-base sm:text-lg font-black text-[#0B3B60] leading-none mt-1">
                        #{h.household_no}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                          {h.head_name || 'अज्ञात मुखिया'}
                        </span>
                        {(() => {
                          const secObj = sectionsList.find((s) => s.id === String(h.village_section) || s.name === String(h.village_section));
                          const secDisplayName = secObj ? secObj.name : (String(h.village_section).startsWith('सेक्शन') ? h.village_section : `सेक्शन ${h.village_section}`);
                          return (
                            <span className="text-[11px] bg-blue-50 text-[#0B3B60] font-bold px-2 py-0.5 rounded border border-blue-200">
                              {secDisplayName}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="text-xs sm:text-sm text-slate-600 font-medium">
                        भवन सं.: <strong className="text-slate-800">{h.building_no}</strong> | मकान सं.: <strong className="text-slate-800">{h.census_house_no}</strong> | सदस्य: <strong className="text-[#0B3B60] font-bold">{hhMembers.length || h.total_members}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Pill */}
                    <div className="hidden xs:flex items-center">
                      {h.sync_status === 'synced' ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>क्लाउड सुरक्षित</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>लोकल (पेंडिंग)</span>
                        </span>
                      )}
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details / Member List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#0B3B60] uppercase tracking-wide">
                        सदस्य सूची ({hhMembers.length})
                      </h4>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditHousehold(h, hhMembers)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0B3B60] text-xs sm:text-sm font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all min-h-[38px]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>संशोधन करें</span>
                        </button>

                        <button
                          onClick={() => handleDeleteHousehold(h.local_id)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-slate-200 shadow-xs active:scale-95 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
                          title="हटाएं"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {hhMembers.length === 0 ? (
                      <p className="text-xs text-slate-500 py-1">कोई सदस्य विवरण नहीं मिला।</p>
                    ) : (
                      <div className="space-y-2">
                        {hhMembers.map((m) => (
                          <div
                            key={m.local_id || m.serial_no}
                            className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 font-extrabold text-xs text-slate-700 flex items-center justify-center shrink-0">
                                {m.serial_no}
                              </span>
                              <div>
                                <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                                  {m.q1_name} {m.serial_no === 1 && <span className="text-[11px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold ml-1">मुखिया</span>}
                                </div>
                                <div className="text-xs text-slate-600 font-medium mt-0.5">
                                  आयु: {m.q4b_age} वर्ष | लिंग: {m.q3_gender === 1 ? 'पुरुष' : m.q3_gender === 2 ? 'महिला' : 'अन्य'} | जाति: {m.q10c_caste_name || 'सामान्य'}
                                </div>
                              </div>
                            </div>

                            {m.q36_mobile_number && (
                              <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{m.q36_mobile_number}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {h.remarks && (
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-slate-700">रिमार्क्स:</strong> {h.remarks}
                      </div>
                    )}
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
