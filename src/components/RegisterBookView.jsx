import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Printer, ChevronUp, Search, X, Filter, ArrowLeft } from 'lucide-react';
import { db } from '../db/db';
import {
  RELATIONSHIP_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
  RELIGION_CODES,
  DISABILITY_CODES,
  EDUCATION_STATUS_CODES,
  EDUCATION_LEVEL_CODES,
  WORK_LAST_YEAR_CODES,
  ECONOMIC_ACTIVITY_CODES,
  WORKER_CLASS_CODES,
  NON_ECONOMIC_ACTIVITY_CODES,
  COMMUTE_MODE_CODES,
  MIGRATION_REASON_CODES
} from '../constants/censusCodes';

// ─── Utility helpers ───────────────────────────────────────────────
function DigitBoxes({ value, count = 1 }) {
  const str = String(value ?? '').replace(/\D/g, '');
  const padded = str.padStart(count, ' ');
  const chars = padded.slice(-count).split('');
  return (
    <span className="inline-flex border border-slate-600">
      {chars.map((ch, i) => (
        <span
          key={i}
          className="w-4 h-4 border-r last:border-r-0 border-slate-400 text-[9px] font-mono font-black flex items-center justify-center text-slate-900"
        >
          {ch.trim()}
        </span>
      ))}
    </span>
  );
}

function Cell({ label, value, span = 1, className = '' }) {
  return (
    <td
      colSpan={span}
      className={`border border-slate-400 p-0.5 text-[8.5px] leading-tight align-top ${className}`}
    >
      {label && <div className="text-[7px] text-slate-500 font-semibold leading-none mb-0.5">{label}</div>}
      <div className="font-semibold text-slate-900 break-words">{value ?? '—'}</div>
    </td>
  );
}

function TH({ children, span = 1, className = '' }) {
  return (
    <th
      colSpan={span}
      className={`border border-slate-500 bg-slate-100 p-0.5 text-[7.5px] font-black text-slate-700 text-center leading-tight ${className}`}
    >
      {children}
    </th>
  );
}

const codeLabel = (map, code) => {
  if (!code && code !== 0) return '—';
  const entry = map[Number(code)];
  if (!entry) return String(code);
  return entry.short || entry.label || String(code);
};

// ─── Single Household Block ─────────────────────────────────────────
function HouseholdBlock({ household, members, sectionName }) {
  const hh = household;

  const renderMemberRow = (m, idx) => {
    if (!m) {
      return (
        <tr key={`empty-${idx}`} className="h-6">
          <td className="border border-slate-300 text-center text-[8px] text-slate-400">{idx + 1}</td>
          {Array(26).fill(null).map((_, i) => (
            <td key={i} className="border border-slate-300 p-0" />
          ))}
        </tr>
      );
    }

    const fatherDisplay = m.q11_father_in_hh
      ? `परि.क्र. ${m.q11_father_serial_no ?? '—'}`
      : m.q11_father_name
      ? `${m.q11_father_name}${m.q11_father_alive === false ? ' (दिवंगत)' : ''}`
      : '—';

    const motherDisplay = m.q12_mother_in_hh
      ? `परि.क्र. ${m.q12_mother_serial_no ?? '—'}`
      : m.q12_mother_name
      ? `${m.q12_mother_name}${m.q12_mother_alive === false ? ' (दिवंगत)' : ''}`
      : '—';

    return (
      <tr key={m.local_id || idx} className="hover:bg-amber-50/40">
        {/* क्र.सं. */}
        <td className="border border-slate-300 text-center text-[8px] font-black text-slate-700 bg-slate-50 w-5">
          {m.serial_no}
        </td>
        {/* Q1 नाम */}
        <td className="border border-slate-300 p-0.5 text-[8px] font-bold text-slate-900 max-w-[70px]">
          {m.q1_name || '—'}
        </td>
        {/* Q2 सम्बन्ध */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q2_relationship ? (
            <span title={codeLabel(RELATIONSHIP_CODES, m.q2_relationship)}>
              {String(m.q2_relationship).padStart(2, '0')}
            </span>
          ) : '—'}
        </td>
        {/* Q3 लिंग */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q3_gender === 1 ? 'पु' : m.q3_gender === 2 ? 'म' : m.q3_gender === 3 ? 'ट्रा' : '—'}
        </td>
        {/* Q4 DOB/आयु */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q4a_dob || ''}<br />
          <span className="font-black">{m.q4b_age ?? '—'} वर्ष</span>
        </td>
        {/* Q5 वैवाहिक */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q5_marital_status ? String(m.q5_marital_status) : '—'}
        </td>
        {/* Q6 शादी आयु */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q6_age_at_marriage ?? '—'}
        </td>
        {/* Q7 पति/पत्नी */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q7_spouse_serial_no ?? '—'}
        </td>
        {/* Q8 राष्ट्रीयता */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q8_nationality || 'भारत'}
        </td>
        {/* Q9 धर्म */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q9_religion ?? '—'}
        </td>
        {/* Q10 SC/ST */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q10a_sc_st === 1 ? 'अ.जा.' : m.q10a_sc_st === 2 ? 'अ.ज.जा.' : 'नहीं'}
          {m.q10c_caste_name ? <span className="block text-[7px] text-slate-500">{m.q10c_caste_name}</span> : null}
        </td>
        {/* Q11 पिता */}
        <td className="border border-slate-300 p-0.5 text-[8px] max-w-[65px] break-words">
          {fatherDisplay}
        </td>
        {/* Q12 माता */}
        <td className="border border-slate-300 p-0.5 text-[8px] max-w-[65px] break-words">
          {motherDisplay}
        </td>
        {/* Q13 दिव्यांगता */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q13a_disabled === 1
            ? (Array.isArray(m.q13b_disability_types) && m.q13b_disability_types.length > 0
                ? m.q13b_disability_types.join(',')
                : 'हाँ')
            : 'नहीं'}
        </td>
        {/* Q14 भाषा */}
        <td className="border border-slate-300 p-0.5 text-[8px]">
          {m.q14a_mother_tongue || '—'}
        </td>
        {/* Q15 साक्षरता */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q15a_literacy === 1 ? 'सा' : m.q15a_literacy === 2 ? 'निर' : '—'}
        </td>
        {/* Q16-17 शिक्षा */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q17a_highest_education != null ? String(m.q17a_highest_education).padStart(2, '0') : '—'}
        </td>
        {/* Q18 कार्य */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q18_work_last_year ?? '—'}
        </td>
        {/* Q19-21 आर्थिक */}
        <td className="border border-slate-300 p-0.5 text-[8px] max-w-[55px] break-words">
          {m.q19_economic_activity ? `${m.q19_economic_activity}` : ''}
          {m.q20_occupation ? <span className="block text-[7px]">{m.q20_occupation}</span> : null}
        </td>
        {/* Q26-29 प्रवास */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q26_birth_place_type === 'here' ? 'यहीं' : m.q26_birth_place_type === 'outside' ? 'विदेश' : 'अन्य'}
        </td>
        {/* Q30 स्थायी पता */}
        <td className="border border-slate-300 p-0.5 text-[8px]">
          {m.q30_permanent_address_same ? 'वही' : m.q30_permanent_address || '—'}
        </td>
        {/* Q35 बैंक */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q35_bank_accounts_count ?? '—'}
        </td>
        {/* Q36 मोबाइल */}
        <td className="border border-slate-300 p-0.5 text-[8px]">
          {m.q36_mobile_number || '—'}
        </td>
        {/* Q37 आधार */}
        <td className="border border-slate-300 p-0.5 text-[8px] font-mono">
          {m.q37_aadhaar_number
            ? `XXXX XXXX ${String(m.q37_aadhaar_number).slice(-4)}`
            : '—'}
        </td>
        {/* Q38 EPIC */}
        <td className="border border-slate-300 p-0.5 text-[8px]">
          {m.q38_voter_id_epic || '—'}
        </td>
        {/* Q40 DL */}
        <td className="border border-slate-300 p-0.5 text-[8px] text-center">
          {m.q40_driving_license === 1 ? 'हाँ' : m.q40_driving_license === 2 ? 'नहीं' : '—'}
        </td>
      </tr>
    );
  };

  const paddedMembers = [...members];
  while (paddedMembers.length < Math.max(6, members.length)) {
    paddedMembers.push(null);
  }

  return (
    <div className="mb-8 household-block" data-hhid={hh.local_id}>
      {/* ── Household Header Bar ── */}
      <div className="bg-[#0B3B60] text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 text-slate-900 font-black text-xs px-2 py-1 rounded flex flex-col items-center leading-none">
            <span className="text-[8px]">भ·{String(hh.building_no).padStart(3,'0')} म·{String(hh.census_house_no).padStart(3,'0')}</span>
            <span className="text-sm">प·{String(hh.household_no).padStart(3,'0')}</span>
          </div>
          <div>
            <div className="font-black text-sm">{hh.head_name || 'अज्ञात मुखिया'}</div>
            <div className="text-[11px] text-slate-300">
              {sectionName} &nbsp;|&nbsp; सदस्य: {members.length} &nbsp;|&nbsp;
              परिवार प्रकार: {hh.household_type === 1 ? 'सामान्य' : hh.household_type === 2 ? 'संस्थागत' : 'बेघर'}
              {hh.se_id ? <span className="ml-2 bg-purple-700 text-white text-[9px] px-1.5 py-0.5 rounded font-black">SE: {hh.se_id}</span> : null}
            </div>
          </div>
        </div>
        <div className={`text-[11px] font-black px-2 py-1 rounded ${hh.sync_status === 'synced' ? 'bg-emerald-600' : 'bg-amber-500 text-slate-900'}`}>
          {hh.sync_status === 'synced' ? '☁ सुरक्षित' : '⏳ लंबित'}
        </div>
      </div>

      {/* ── Location strip ── */}
      <div className="bg-slate-50 border-x border-slate-300 px-3 py-1 text-[9px] text-slate-600 flex flex-wrap gap-3">
        <span>राज्य: <strong>{hh.state_name || 'उत्तर प्रदेश'}</strong></span>
        <span>जिला: <strong>{hh.district_name || '—'}</strong></span>
        <span>तहसील: <strong>{hh.tehsil_block || '—'}</strong></span>
        <span>ग्राम/वार्ड: <strong>{hh.ward_village_name || '—'}</strong></span>
        <span>प्रगणना खण्ड: <strong>{hh.enumeration_block_no || '—'}</strong></span>
      </div>

      {/* ── Self-enumerated notice ── */}
      {hh.is_self_enumerated ? (
        <div className="border border-purple-300 bg-purple-50 px-3 py-2 text-xs text-purple-800 font-bold rounded-b-lg border-t-0">
          🌐 यह परिवार स्व-गणना कर चुका है। SE ID: <strong>{hh.se_id}</strong>
        </div>
      ) : (
        /* ── Members Table ── */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <TH>क्र.</TH>
                <TH>Q1 नाम</TH>
                <TH>Q2 सम्बन्ध</TH>
                <TH>Q3 लिंग</TH>
                <TH>Q4 जन्म/आयु</TH>
                <TH>Q5 वैवाहिक</TH>
                <TH>Q6 श.आयु</TH>
                <TH>Q7 पति/पत्नी</TH>
                <TH>Q8 राष्ट्री.</TH>
                <TH>Q9 धर्म</TH>
                <TH>Q10 जाति</TH>
                <TH>Q11 पिता</TH>
                <TH>Q12 माता</TH>
                <TH>Q13 दिव्यां.</TH>
                <TH>Q14 भाषा</TH>
                <TH>Q15 साक्षर</TH>
                <TH>Q17 शिक्षा</TH>
                <TH>Q18 कार्य</TH>
                <TH>Q19-21 आर्थिक</TH>
                <TH>Q26 जन्म</TH>
                <TH>Q30 स्थायी</TH>
                <TH>Q35 बैंक</TH>
                <TH>Q36 मोबाइल</TH>
                <TH>Q37 आधार</TH>
                <TH>Q38 EPIC</TH>
                <TH>Q40 DL</TH>
              </tr>
            </thead>
            <tbody>
              {paddedMembers.map((m, idx) => renderMemberRow(m, idx))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Remarks ── */}
      {hh.remarks && (
        <div className="border border-slate-300 border-t-0 bg-yellow-50 px-3 py-1 text-[9px] text-slate-700 rounded-b-lg">
          <strong>टिप्पणी:</strong> {hh.remarks}
        </div>
      )}
    </div>
  );
}

// ─── Main RegisterBookView ──────────────────────────────────────────
export default function RegisterBookView({ activeSection, onBack }) {
  const [households, setHouseholds] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [sectionsList, setSectionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const settings = await db.settings.get('active_settings');
        if (settings?.sections) setSectionsList(settings.sections || []);

        let hhs = await db.households.orderBy('building_no').toArray();
        // Sort: building → census_house → household
        hhs.sort((a, b) => {
          const ba = String(a.building_no).padStart(5, '0');
          const bb = String(b.building_no).padStart(5, '0');
          if (ba !== bb) return ba.localeCompare(bb);
          const ca = String(a.census_house_no).padStart(5, '0');
          const cb = String(b.census_house_no).padStart(5, '0');
          if (ca !== cb) return ca.localeCompare(cb);
          return String(a.household_no).padStart(5, '0').localeCompare(String(b.household_no).padStart(5, '0'));
        });

        setHouseholds(hhs);

        // Load all members
        const allMembers = await db.members.toArray();
        const map = {};
        for (const m of allMembers) {
          if (!map[m.household_local_id]) map[m.household_local_id] = [];
          map[m.household_local_id].push(m);
        }
        // Sort members by serial_no within each household
        for (const key of Object.keys(map)) {
          map[key].sort((a, b) => (a.serial_no || 0) - (b.serial_no || 0));
        }
        setMembersMap(map);
      } catch (err) {
        console.error('RegisterBook load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getSectionName = (hh) => {
    if (!sectionsList.length) return `प्रभाग ${hh.village_section || '—'}`;
    const found = sectionsList.find(
      (s) => s.id === String(hh.village_section) || s.name === String(hh.village_section)
    );
    return found ? found.name : `प्रभाग ${hh.village_section}`;
  };

  // ── Filter logic ──
  const filtered = households.filter((hh) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (hh.head_name && hh.head_name.toLowerCase().includes(q)) ||
      String(hh.building_no).includes(q) ||
      String(hh.census_house_no).includes(q) ||
      String(hh.household_no).includes(q) ||
      (membersMap[hh.local_id] || []).some(
        (m) => m.q1_name && m.q1_name.toLowerCase().includes(q)
      );

    const matchesSection =
      filterSection === 'all' || String(hh.village_section) === filterSection;

    return matchesSearch && matchesSection;
  });

  const totalMembers = filtered.reduce((acc, hh) => acc + (membersMap[hh.local_id]?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 font-['Hind']">
      {/* ── Sticky Toolbar ── */}
      <div className="sticky top-0 z-30 bg-[#0B3B60] text-white shadow-lg print:hidden">
        <div className="px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-black text-sm leading-none">परिवार पंजिका (Register Book)</div>
              <div className="text-[10px] text-slate-300 leading-none mt-0.5">
                {filtered.length} परिवार &nbsp;|&nbsp; {totalMembers} सदस्य
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="नाम / भवन / मकान खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-6 py-1.5 rounded-lg text-xs bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/20 w-44"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-slate-300" />
                </button>
              )}
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-300" />
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="text-xs bg-white/10 border border-white/20 text-white rounded-lg py-1.5 px-2 focus:outline-none"
              >
                <option value="all" className="text-slate-900">सभी प्रभाग</option>
                {sectionsList.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs px-3 py-1.5 rounded-lg shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट</span>
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="bg-[#072F5F] px-3 py-1 flex gap-4 text-[10px] text-slate-300 overflow-x-auto">
          {sectionsList.map((s) => {
            const count = households.filter((h) => String(h.village_section) === s.id).length;
            const memCount = households
              .filter((h) => String(h.village_section) === s.id)
              .reduce((acc, h) => acc + (membersMap[h.local_id]?.length || 0), 0);
            return (
              <button
                key={s.id}
                onClick={() => setFilterSection(filterSection === s.id ? 'all' : s.id)}
                className={`whitespace-nowrap font-bold px-2 py-0.5 rounded transition ${filterSection === s.id ? 'bg-amber-400 text-slate-900' : 'hover:text-white'}`}
              >
                {s.name}: {count} परिवार / {memCount} सदस्य
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={topRef} className="max-w-screen-2xl mx-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-10 h-10 border-4 border-[#0B3B60] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm font-bold">डेटा लोड हो रहा है...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <BookOpen className="w-16 h-16 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-lg">कोई परिवार नहीं मिला</p>
            <p className="text-sm">खोज बदलें या नई प्रविष्टि करें</p>
          </div>
        ) : (
          <>
            {/* Page title for print */}
            <div className="hidden print:block text-center mb-4">
              <h1 className="text-lg font-black">परिवार पंजिका — जनगणना / जातिगत सर्वेक्षण</h1>
            </div>

            {filtered.map((hh) => (
              <HouseholdBlock
                key={hh.local_id}
                household={hh}
                members={membersMap[hh.local_id] || []}
                sectionName={getSectionName(hh)}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Scroll to top ── */}
      {showScrollTop && (
        <button
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-5 z-50 bg-[#0B3B60] text-white p-3 rounded-full shadow-xl hover:bg-[#072F5F] transition print:hidden"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .household-block { page-break-inside: avoid; margin-bottom: 16px; }
          body { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}
