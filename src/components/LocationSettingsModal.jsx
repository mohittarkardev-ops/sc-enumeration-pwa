import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Database, 
  MapPin, 
  CheckCircle, 
  ChevronDown, 
  Shield, 
  Plus, 
  Trash2, 
  Layers,
  Activity,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { db } from '../db/db';
import { getSupabaseConfig, setSupabaseConfig, checkDatabaseConnection } from '../db/supabase';
import { INDIAN_STATES, UP_DISTRICTS, MATHURA_BLOCKS } from '../constants/indiaLocations';
import { sanitizeText, sanitizeAlphanumeric } from '../utils/validation';

export default function LocationSettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [formData, setFormData] = useState({
    state_name: 'उत्तर प्रदेश (Uttar Pradesh)',
    district_name: 'मथुरा (Mathura)',
    tehsil_block: 'मथुरा (Mathura)',
    ward_village_name: '',
    village_code: '',
    enumeration_block_no: '001',
    enumerator_name: '',
    enumerator_id: 'ENUM-001',
    sections: [
      { id: '1', name: 'सेक्शन 1' },
      { id: '2', name: 'सेक्शन 2' },
      { id: '3', name: 'सेक्शन 3' }
    ]
  });

  const [customDistrict, setCustomDistrict] = useState(false);
  const [customBlock, setCustomBlock] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const [supabaseUrl, setSupabaseUrlState] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKeyState] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Database Test States
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      db.settings.get('active_settings').then((saved) => {
        if (saved) {
          setFormData((prev) => ({
            ...prev,
            ...saved,
            state_name: saved.state_name || 'उत्तर प्रदेश (Uttar Pradesh)',
            district_name: saved.district_name || 'मथुरा (Mathura)',
            tehsil_block: saved.tehsil_block || 'मथुरा (Mathura)',
            sections: saved.sections && saved.sections.length > 0 ? saved.sections : prev.sections
          }));
        }
      });

      const conf = getSupabaseConfig();
      setSupabaseUrlState(conf.url);
      setSupabaseAnonKeyState(conf.anonKey);
      setSavedSuccess(false);
      setDbTestResult(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDistrictSelect = (e) => {
    const val = e.target.value;
    if (val === 'अन्य जिला') {
      setCustomDistrict(true);
      setFormData((prev) => ({ ...prev, district_name: '' }));
    } else {
      setCustomDistrict(false);
      setFormData((prev) => ({ ...prev, district_name: val }));
    }
  };

  const handleBlockSelect = (e) => {
    const val = e.target.value;
    if (val === 'अन्य ब्लॉक') {
      setCustomBlock(true);
      setFormData((prev) => ({ ...prev, tehsil_block: '' }));
    } else {
      setCustomBlock(false);
      setFormData((prev) => ({ ...prev, tehsil_block: val }));
    }
  };

  const handleUpdateSectionName = (id, newName) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, name: newName } : s))
    }));
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const newId = Date.now().toString().slice(-4);
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, { id: newId, name: newSectionName.trim() }]
    }));
    setNewSectionName('');
  };

  const handleDeleteSection = (id) => {
    if (formData.sections.length <= 1) {
      alert('कम से कम एक सेक्शन होना अनिवार्य है!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id)
    }));
  };

  // Run live database test
  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    const result = await checkDatabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTestingDb(false);
    setDbTestResult(result);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl, supabaseAnonKey);

    const updated = {
      ...formData,
      ward_village_name: sanitizeText(formData.ward_village_name),
      village_code: sanitizeAlphanumeric(formData.village_code),
      enumeration_block_no: sanitizeAlphanumeric(formData.enumeration_block_no),
      enumerator_name: sanitizeText(formData.enumerator_name),
      enumerator_id: sanitizeAlphanumeric(formData.enumerator_id),
      id: 'active_settings',
      updated_at: new Date().toISOString()
    };
    await db.settings.put(updated);

    setSavedSuccess(true);
    if (onSettingsUpdated) onSettingsUpdated(updated);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto font-['Hind']">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Official Header */}
        <div className="bg-[#0B3B60] text-white px-4 py-3 sm:py-3.5 flex items-center justify-between border-b border-[#072F5F]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">प्रगणक एवं प्रशासनिक स्थान विन्यास</h2>
              <p className="text-[11px] text-slate-200">Administrative Location & Database Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 text-white transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form with Comfortable Touch Sizing */}
        <form onSubmit={handleSave} className="p-3.5 sm:p-4 space-y-4 max-h-[82vh] overflow-y-auto momentum-scroll text-sm">
          
          {/* SECTION A: DYNAMIC VILLAGE SECTIONS */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#0B3B60]" />
                <h3 className="font-bold text-[#0B3B60] text-sm uppercase tracking-wide">
                  प्रगणक के आवंटित ग्राम प्रभाग / सेक्शंस
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                1 प्रगणक : अनेक प्रभाग
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-normal">
              यहाँ आप प्रत्येक सेक्शन का नाम व्यक्ति (उदा. <em>सुरेश कुमार - भाग 1</em>), टोला, या मोहल्ले के अनुसार बदल सकते हैं:
            </p>

            {/* List of Dynamic Sections */}
            <div className="space-y-2">
              {formData.sections.map((sec, idx) => (
                <div key={sec.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={sec.name}
                    onChange={(e) => handleUpdateSectionName(sec.id, e.target.value)}
                    placeholder="सेक्शन / व्यक्ति / टोले का नाम"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                  />
                  {formData.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="सेक्शन हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Section */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="+ नए प्रभाग / टोले का नाम लिखें"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
              />
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3.5 py-2 bg-[#0B3B60] hover:bg-[#134D7E] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 shadow-sm active:scale-95 transition-all min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>जोड़ें</span>
              </button>
            </div>
          </div>

          {/* SECTION B: ADMINISTRATIVE LOCATION */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 shadow-sm space-y-3">
            <h3 className="font-bold text-[#0B3B60] text-sm uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0B3B60]" />
              <span>भौगोलिक एवं प्रशासनिक इकाई विवरण</span>
            </h3>

            {/* State */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                राज्य / संघ राज्य क्षेत्र (State / UT) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  name="state_name"
                  value={formData.state_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white appearance-none pr-8 text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                जिला (District) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  value={customDistrict ? 'अन्य जिला' : formData.district_name}
                  onChange={handleDistrictSelect}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white appearance-none pr-8 text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                >
                  {UP_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                  <option value="अन्य जिला">अन्य जिला (मैन्युअल लिखें)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>

              {customDistrict && (
                <input
                  type="text"
                  name="district_name"
                  value={formData.district_name}
                  onChange={handleChange}
                  placeholder="जिले का नाम दर्ज करें"
                  className="w-full mt-2 px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white text-sm"
                  required
                />
              )}
            </div>

            {/* Tehsil / Block */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                तहसील / विकास खंड (Block / Tehsil) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  value={customBlock ? 'अन्य ब्लॉक' : formData.tehsil_block}
                  onChange={handleBlockSelect}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white appearance-none pr-8 text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
                >
                  {MATHURA_BLOCKS.map((blk) => (
                    <option key={blk} value={blk}>
                      {blk}
                    </option>
                  ))}
                  <option value="अन्य ब्लॉक">अन्य ब्लॉक/तहसील (मैन्युअल लिखें)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>

              {customBlock && (
                <input
                  type="text"
                  name="tehsil_block"
                  value={formData.tehsil_block}
                  onChange={handleChange}
                  placeholder="तहसील या ब्लॉक का नाम दर्ज करें"
                  className="w-full mt-2 px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white text-sm"
                  required
                />
              )}
            </div>

            {/* Village / Town */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                गांव / शहर / वार्ड का नाम (Village / Ward) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="ward_village_name"
                value={formData.ward_village_name}
                onChange={handleChange}
                placeholder="उदा. राल, बरसाना, गोवर्धन, आदि"
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
              />
            </div>

            {/* Village Code & Block No */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  गांव का कोड (LGD Code)
                </label>
                <input
                  type="text"
                  name="village_code"
                  value={formData.village_code}
                  onChange={handleChange}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  गणना ब्लॉक सं. (EB No.) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="enumeration_block_no"
                  value={formData.enumeration_block_no}
                  onChange={handleChange}
                  placeholder="001"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: ENUMERATOR CREDENTIALS */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 shadow-sm space-y-2.5">
            <h3 className="font-bold text-[#0B3B60] text-sm uppercase tracking-wide">
              प्रगणक पहचान विवरण (Enumerator Credentials)
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">प्रगणक का नाम</label>
                <input
                  type="text"
                  name="enumerator_name"
                  value={formData.enumerator_name}
                  onChange={handleChange}
                  placeholder="उदा. मोहित तरकर"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 bg-white text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">प्रगणक ID सं.</label>
                <input
                  type="text"
                  name="enumerator_id"
                  value={formData.enumerator_id}
                  onChange={handleChange}
                  placeholder="ENUM-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION D: REAL SUPABASE CLOUD DATABASE + LIVE CONNECTION TEST */}
          <div className="border-2 border-blue-200 rounded-2xl p-4 bg-blue-50/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#0B3B60] text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#0B3B60]" />
                <span>केंद्रीय डेटाबेस विन्यास (Supabase Sync)</span>
              </h3>
              <span className="text-[10px] bg-blue-100 text-[#0B3B60] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                PostgreSQL Cloud
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Project URL <span className="text-slate-500 font-normal">(उदा: https://xyz.supabase.co)</span>
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrlState(e.target.value)}
                placeholder="https://yolzmlamagzlwfiievks.supabase.co"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Anon / Public API Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKeyState(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-[#0B3B60]/20 focus:border-[#0B3B60]"
              />
            </div>

            {/* LIVE CONNECTION TEST BUTTON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className="w-full py-2.5 px-3 bg-white hover:bg-blue-100/70 border border-[#0B3B60]/30 text-[#0B3B60] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                {isTestingDb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0B3B60]" />
                    <span>डेटाबेस से सीधा संपर्क जाँचा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>वास्तविक डेटाबेस कनेक्शन टेस्ट करें (Real Test)</span>
                  </>
                )}
              </button>
            </div>

            {/* REAL DATABASE TEST RESULT FEEDBACK BOX */}
            {dbTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                  dbTestResult.connected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : dbTestResult.code === 'SCHEMA_MISSING'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-2">
                  {dbTestResult.connected ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>स्थिति: {dbTestResult.statusText}</span>
                      {dbTestResult.latency > 0 && (
                        <span className="text-[11px] font-mono bg-white/80 px-1.5 py-0.5 rounded border border-current">
                          पिंक: {dbTestResult.latency}ms
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed">{dbTestResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#0B3B60] hover:bg-[#134D7E] active:scale-95 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-md transition-all text-sm sm:text-base min-h-[48px]"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>विन्यास सुरक्षित किया गया</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>विन्यास सुरक्षित करें (Save Settings)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
