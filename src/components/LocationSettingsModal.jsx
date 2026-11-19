import React, { useState, useEffect } from 'react';
import { X, Save, Database, MapPin, CheckCircle, ChevronDown, Shield } from 'lucide-react';
import { db } from '../db/db';
import { getSupabaseConfig, setSupabaseConfig } from '../db/supabase';
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
    enumerator_id: 'ENUM-001'
  });

  const [customDistrict, setCustomDistrict] = useState(false);
  const [customBlock, setCustomBlock] = useState(false);

  const [supabaseUrl, setSupabaseUrlState] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKeyState] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      db.settings.get('active_settings').then((saved) => {
        if (saved) {
          setFormData((prev) => ({
            ...prev,
            ...saved,
            state_name: saved.state_name || 'उत्तर प्रदेश (Uttar Pradesh)',
            district_name: saved.district_name || 'मथुरा (Mathura)',
            tehsil_block: saved.tehsil_block || 'मथुरा (Mathura)'
          }));
        }
      });

      const conf = getSupabaseConfig();
      setSupabaseUrlState(conf.url);
      setSupabaseAnonKeyState(conf.anonKey);
      setSavedSuccess(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-sm overflow-y-auto font-['Hind']">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden my-auto border border-slate-300">
        
        {/* Official Header */}
        <div className="bg-[#0B3B60] text-white px-4 py-3 flex items-center justify-between border-b border-[#072F5F]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">प्रगणक एवं प्रशासनिक स्थान विन्यास</h2>
              <p className="text-[10px] text-slate-200">Administrative Location & System Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 active:scale-95 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 max-h-[82vh] overflow-y-auto text-xs">
          
          {/* Section 1: Administrative Location */}
          <fieldset className="border border-slate-300 rounded p-3 bg-slate-50/50 space-y-2.5">
            <legend className="px-2 font-bold text-[#0B3B60] text-xs uppercase tracking-wide">
              1. भौगोलिक एवं प्रशासनिक इकाई विवरण
            </legend>

            {/* State */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                राज्य / संघ राज्य क्षेत्र (State / UT) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  name="state_name"
                  value={formData.state_name}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 bg-white appearance-none pr-8 text-xs focus:ring-1 focus:ring-[#0B3B60]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* District */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800">
                  जिला (District) <span className="text-red-600">*</span>
                </label>
                {customDistrict && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDistrict(false);
                      setFormData((p) => ({ ...p, district_name: 'मथुरा (Mathura)' }));
                    }}
                    className="text-[10px] text-[#0B3B60] font-bold underline"
                  >
                    मथुरा चुनें
                  </button>
                )}
              </div>

              {!customDistrict ? (
                <div className="relative">
                  <select
                    value={formData.district_name}
                    onChange={handleDistrictSelect}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 bg-white appearance-none pr-8 text-xs focus:ring-1 focus:ring-[#0B3B60]"
                  >
                    {UP_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  name="district_name"
                  value={formData.district_name}
                  onChange={handleChange}
                  placeholder="जिले का नाम लिखें"
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 bg-white text-xs"
                />
              )}
            </div>

            {/* Tehsil / Block */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800">
                  तहसील / ब्लॉक (Tehsil / Block) <span className="text-red-600">*</span>
                </label>
                {customBlock && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomBlock(false);
                      setFormData((p) => ({ ...p, tehsil_block: 'मथुरा (Mathura)' }));
                    }}
                    className="text-[10px] text-[#0B3B60] font-bold underline"
                  >
                    सूची से चुनें
                  </button>
                )}
              </div>

              {!customBlock ? (
                <div className="relative">
                  <select
                    value={formData.tehsil_block}
                    onChange={handleBlockSelect}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 bg-white appearance-none pr-8 text-xs focus:ring-1 focus:ring-[#0B3B60]"
                  >
                    {MATHURA_BLOCKS.map((blk) => (
                      <option key={blk} value={blk}>
                        {blk}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  name="tehsil_block"
                  value={formData.tehsil_block}
                  onChange={handleChange}
                  placeholder="तहसील/ब्लॉक का नाम लिखें"
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 bg-white text-xs"
                />
              )}
            </div>

            {/* Village Name & Enumeration Block */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  गांव / वार्ड का नाम <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="ward_village_name"
                  value={formData.ward_village_name}
                  onChange={handleChange}
                  placeholder="उदा. राल, बरसाना, गोकुल"
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold text-slate-900 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  गांव का कोड (LGD Code)
                </label>
                <input
                  type="text"
                  name="village_code"
                  value={formData.village_code}
                  onChange={handleChange}
                  placeholder="उदा. 123456"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  गणना ब्लॉक सं. (EB No.) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="enumeration_block_no"
                  value={formData.enumeration_block_no}
                  onChange={handleChange}
                  placeholder="001"
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white text-xs"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Enumerator Credentials */}
          <fieldset className="border border-slate-300 rounded p-3 bg-slate-50/50 space-y-2">
            <legend className="px-2 font-bold text-[#0B3B60] text-xs uppercase tracking-wide">
              2. प्रगणक पहचान विवरण (Enumerator Credentials)
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-0.5">प्रगणक का नाम</label>
                <input
                  type="text"
                  name="enumerator_name"
                  value={formData.enumerator_name}
                  onChange={handleChange}
                  placeholder="नाम दर्ज करें"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-0.5">प्रगणक पहचान पत्र संख्या</label>
                <input
                  type="text"
                  name="enumerator_id"
                  value={formData.enumerator_id}
                  onChange={handleChange}
                  placeholder="ENUM-001"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white text-xs"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 3: Supabase Cloud Database */}
          <fieldset className="border border-slate-300 rounded p-3 bg-blue-50/40 space-y-2">
            <legend className="px-2 font-bold text-[#0B3B60] text-xs uppercase tracking-wide flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-[#0B3B60]" />
              <span>3. केंद्रीय सर्वर डेटाबेस विन्यास (Supabase)</span>
            </legend>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-0.5">Project URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrlState(e.target.value)}
                placeholder="https://yolzmlamagzlwfiievks.supabase.co"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white text-[11px]"
              />
              <span className="text-[10px] text-slate-500">
                नोट: URL में अंत में <code>/rest/v1/</code> न लगाएं। ऐप इसे स्वतः शुद्ध कर लेता है।
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-0.5">Anon / Public API Key</label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKeyState(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white text-[11px]"
              />
            </div>
          </fieldset>

          {/* Save Action */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0B3B60] hover:bg-[#134D7E] active:scale-95 text-white rounded font-bold flex items-center justify-center gap-1.5 shadow transition-all text-xs"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>विन्यास सुरक्षित किया गया</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
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
