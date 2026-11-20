import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Search, 
  X, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Layers, 
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Lock,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { db } from '../db/db';
import {
  RELATIONSHIP_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
  RELIGION_CODES,
  DISABILITY_CODES,
  EDUCATION_STATUS_CODES,
  EDUCATION_LEVEL_CODES,
  EDUCATION_SUBJECT_CODES,
  WORK_LAST_YEAR_CODES,
  ECONOMIC_ACTIVITY_CODES,
  WORKER_CLASS_CODES,
  NON_ECONOMIC_ACTIVITY_CODES,
  COMMUTE_MODE_CODES,
  MIGRATION_REASON_CODES
} from '../constants/censusCodes';
import { formatBilingualName, transliterateEnglishToHindi } from '../utils/hindiTransliteration';

/**
 * DigitBoxes: Official Census digit / character boxes matching the paper proforma
 */
function DigitBoxes({ value, count = 1, className = '' }) {
  const str = String(value ?? '').replace(/\D/g, '');
  const padded = str.padStart(count, ' ');
  const chars = padded.slice(-count).split('');

  return (
    <span className={`inline-flex border border-slate-900 bg-white align-middle ${className}`}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="w-3.5 h-4.5 sm:w-4 sm:h-5 border-r last:border-r-0 border-slate-600 font-mono text-[10px] sm:text-[11px] font-black flex items-center justify-center text-slate-950 leading-none"
        >
          {char.trim()}
        </span>
      ))}
    </span>
  );
}

/**
 * SingleBox: Single code box (1-digit or checkbox)
 */
function SingleBox({ value, emptyDash = true, className = '' }) {
  const val = value !== undefined && value !== null && value !== '' ? String(value) : (emptyDash ? '—' : '');
  return (
    <span className={`w-4.5 h-4.5 sm:w-5 sm:h-5 border border-slate-900 font-mono text-[10.5px] sm:text-xs font-black flex items-center justify-center bg-white text-slate-950 mx-auto ${className}`}>
      {val}
    </span>
  );
}

/**
 * DateBoxes: DD MM YYYY date boxes matching official schedule
 */
function DateBoxes({ dobString }) {
  if (!dobString || !dobString.includes('/')) {
    return <DigitBoxes value="" count={8} />;
  }
  const parts = dobString.split('/');
  const day = (parts[0] || '').padStart(2, ' ');
  const month = (parts[1] || '').padStart(2, ' ');
  const year = (parts[2] || '').padStart(4, ' ');
  const combined = `${day}${month}${year}`;
  return <DigitBoxes value={combined} count={8} />;
}

/**
 * Single Official Household Schedule (Side A or Side B) - Full Continuous Family Serialization
 */
function HouseholdProformaSheet({
  household,
  members = [],
  settings,
  side = 'A' // 'A' or 'B'
}) {
  const isDraft = household.status === 'draft';
  const isSelfEnumerated = !!household.is_self_enumerated;

  return (
    <div
      className={`shadow-md p-3 sm:p-4 mb-6 proforma-sheet text-slate-950 max-w-[1280px] mx-auto relative overflow-hidden print:shadow-none print:p-2 print:mb-0 print:page-break-after-always transition-all ${
        isDraft
          ? 'bg-[#fff1f2] border-4 border-red-600 shadow-xl shadow-red-200/60 print:bg-red-50/40 print:border-red-600'
          : 'bg-white border-2 border-slate-900 print:border-2 print:border-black'
      }`}
    >
      {/* Background Watermark for DRAFT */}
      {isDraft && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] select-none overflow-hidden z-0">
          <span className="text-red-700 font-black text-6xl sm:text-8xl transform -rotate-45 whitespace-nowrap tracking-widest uppercase">
            DRAFT • अपूर्ण प्रपत्र • DO NOT LOCK
          </span>
        </div>
      )}

      {/* Prominent Red Alert Banner for DRAFT */}
      {isDraft && (
        <div className="mb-3 bg-red-600 text-white p-2.5 sm:p-3 rounded-xl border-2 border-red-800 shadow-md flex items-center justify-between gap-3 relative z-10 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 shrink-0 animate-bounce" />
            <div>
              <div className="font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 flex-wrap">
                <span>⚠️ ड्राफ्ट प्रपत्र (DRAFT SCHEDULE) — जानकारी अभी पूर्ण नहीं है!</span>
                <span className="bg-white text-red-700 text-[10px] font-black px-2 py-0.5 rounded uppercase shadow-2xs">
                  अपूर्ण प्रपत्र
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-medium mt-0.5">
                विशेष ध्यान दें: यह प्रपत्र अभी अधूरा (ड्राफ्ट) है। कृपया इस जानकारी को अंतिम समझकर गलती से भी लॉक न करें!
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="text-[10.5px] bg-red-800 border border-red-400 text-red-100 font-black px-2.5 py-1 rounded-lg">
              स्थिति: ड्राफ्ट (सत्यापन शेष)
            </span>
          </div>
        </div>
      )}

      {/* ── Official Government Header ── */}
      <div className="border-b-2 border-slate-900 pb-2 mb-2 relative z-10">
        <div className="text-center relative">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700">
            भारत सरकार • गृह मंत्रालय • महारजिस्ट्रार एवं जनगणना आयुक्त का कार्यालय
          </div>
          <h1 className="text-base sm:text-xl font-black tracking-wide uppercase mt-0.5">
            परिवार प्रपत्र (HOUSEHOLD SCHEDULE)
          </h1>
          <div
            className={`absolute right-0 top-0 font-mono text-xs font-black px-2.5 py-1 rounded shadow-xs print:text-black print:bg-white print:border print:border-black ${
              isDraft ? 'bg-red-600 text-white border border-red-700' : 'bg-slate-900 text-white'
            }`}
          >
            {isDraft ? '⚠️ ड्राफ्ट • ' : ''}
            {side === 'A' ? 'SIDE - A (प्र. 1 से 17)' : 'SIDE - B (प्र. 18 से 40)'}
          </div>
        </div>

        {/* Location & Identification Header Grid */}
        <div
          className={`mt-2 text-[10.5px] border ${
            isDraft ? 'border-red-400 bg-red-100/70' : 'border-slate-700 bg-slate-50/70'
          } p-2 space-y-1.5`}
        >
          {/* Row 1: Location details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-300 pb-1.5">
            <div>
              <span className="font-bold">राज्य/संघ राज्य: </span>
              <span className="font-black">{household.state_name || settings?.state_name || 'उत्तर प्रदेश'}</span>
              <DigitBoxes value={household.state_code || '09'} count={2} className="ml-1" />
            </div>
            <div>
              <span className="font-bold">जिला: </span>
              <span className="font-black">{household.district_name || settings?.district_name || 'मथुरा'}</span>
              <DigitBoxes value={household.district_code || '14'} count={2} className="ml-1" />
            </div>
            <div>
              <span className="font-bold">तहसील/तालुक/ब्लॉक: </span>
              <span className="font-black">{household.tehsil_block || settings?.tehsil_block || 'मथुरा'}</span>
              <DigitBoxes value={household.tehsil_code || '001'} count={3} className="ml-1" />
            </div>
            <div>
              <span className="font-bold">वार्ड/गाँव: </span>
              <span className="font-black">{household.ward_village_name || settings?.ward_village_name || '—'}</span>
              <DigitBoxes value={household.village_code || settings?.village_code || '001'} count={3} className="ml-1" />
            </div>
          </div>

          {/* Row 2: Building, house, family, and SE ID */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div>
                <span className="font-bold">भवन संख्या: </span>
                <DigitBoxes value={household.building_no} count={3} />
              </div>
              <div>
                <span className="font-bold">जनगणना मकान सं.: </span>
                <DigitBoxes value={household.census_house_no} count={3} />
              </div>
              <div>
                <span className="font-bold">गणना ब्लॉक सं.: </span>
                <DigitBoxes value={household.enumeration_block_no || '001'} count={3} />
              </div>
              <div>
                <span className="font-bold">परिवार संख्या: </span>
                <DigitBoxes value={household.household_no} count={3} />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div>
                <span className="font-bold">प्रकार (1-सा., 2-सं., 3-बेघर): </span>
                <SingleBox value={household.household_type || 1} />
              </div>
              <div>
                <span className="font-bold">कुल सदस्य: </span>
                <DigitBoxes value={isSelfEnumerated ? (household.total_members || 1) : members.length} count={2} />
              </div>

              {/* Official SE ID digit boxes */}
              <div className="flex items-center gap-1 bg-amber-100/90 border border-slate-900 px-1.5 py-0.5 rounded">
                <span className="font-black text-[9.5px]">स्ट. गणना आईडी: </span>
                <span className="inline-flex border border-slate-900 bg-white">
                  <span className="w-3.5 h-4.5 sm:w-4 sm:h-5 flex items-center justify-center font-black border-r border-slate-900 bg-amber-300 text-[10px]">
                    P
                  </span>
                  {Array.from({ length: 10 }).map((_, i) => {
                    const digits = (household.se_id || '').replace(/^P/i, '');
                    return (
                      <span
                        key={i}
                        className="w-3 h-4.5 sm:w-3.5 sm:h-5 border-r last:border-r-0 border-slate-700 flex items-center justify-center font-mono font-bold text-[10px]"
                      >
                        {digits[i] || ''}
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Self-Enumeration Special Banner (if self-enumerated) ── */}
      {isSelfEnumerated && (
        <div className="mb-2 bg-purple-50 border-2 border-purple-800 p-2.5 rounded text-purple-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-700 shrink-0" />
            <div>
              <div className="font-black text-xs sm:text-sm">
                स्व-गणना सत्यापित परिवार (Self-Enumerated Household)
              </div>
              <div className="text-[11px] text-purple-800">
                इस परिवार ने जनगणना पोर्टल पर स्व-गणना पूरी की है। SE ID: <strong>{household.se_id}</strong> • कुल सदस्य: <strong>{household.total_members || members.length}</strong>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-purple-800 text-white font-black text-[10px] px-2 py-0.5 rounded">
              सत्यापित
            </span>
          </div>
        </div>
      )}

      {/* ── SIDE A TABLE (Questions 1 to 17) ── */}
      {side === 'A' && (
        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full border-collapse text-center text-[10px] sm:text-[10.5px]">
            <thead>
              <tr
                className={`border-b-2 font-black leading-tight ${
                  isDraft ? 'bg-red-200/90 border-red-800 text-red-950' : 'bg-slate-200 border-slate-900 text-slate-950'
                }`}
              >
                <th className="border-r border-slate-700 p-1 w-7">क्र. सं.</th>
                <th className="border-r border-slate-700 p-1 min-w-[110px]">Q.1 व्यक्ति का नाम</th>
                <th className="border-r border-slate-700 p-1 w-16">Q.2 सम्बन्ध [कोड]</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.3 लिंग</th>
                <th className="border-r border-slate-700 p-1 w-28">Q.4 जन्म तिथि व आयु</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.5 स्थिति</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.6 वि.आयु</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.7 पति/पत्नी क्र.</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.8 राष्ट्र</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.9 धर्म</th>
                <th className="border-r border-slate-700 p-1 min-w-[95px]">Q.10 जाति / SC / ST</th>
                <th className="border-r border-slate-700 p-1 min-w-[90px]">Q.11 पिता विवरण</th>
                <th className="border-r border-slate-700 p-1 min-w-[90px]">Q.12 माता विवरण</th>
                <th className="border-r border-slate-700 p-1 w-20">Q.13 दिव्यांगता [क][ख: 1-3]</th>
                <th className="border-r border-slate-700 p-1 w-20">Q.14 भाषाएँ</th>
                <th className="border-r border-slate-700 p-1 w-14">Q.15 साक्षर</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.16 शिक्षा</th>
                <th className="p-1 w-16">Q.17 स्तर व विषय</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr className="border-b border-slate-300 h-13">
                  <td className="border-r border-slate-400 font-bold font-mono text-slate-400 bg-slate-50">1</td>
                  <td className="border-r border-slate-300 text-center text-slate-400 text-xs italic py-4" colSpan={17}>
                    परिवार में कोई सदस्य दर्ज नहीं है
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
                  const rowNum = m.serial_no || idx + 1;
                  return (
                    <tr key={m.local_id || idx} className="border-b border-slate-800 font-medium h-13 hover:bg-amber-50/30">
                      {/* S.No */}
                      <td className="border-r border-slate-700 p-1 font-black font-mono bg-slate-100">{rowNum}</td>

                    {/* Q.1 Name (Bilingual Hindi & English) */}
                    <td className="border-r border-slate-700 p-1 font-bold text-left text-slate-950">
                      {(() => {
                        const b = formatBilingualName(m.q1_name);
                        if (b.isTransliterated) {
                          return (
                            <div className="flex flex-col leading-tight">
                              <span className="font-serifHindi font-bold text-slate-950 text-xs sm:text-[13px]">{b.hindi}</span>
                              <span className="text-[9.5px] text-slate-500 font-mono font-medium tracking-tight uppercase print:text-black">{b.english}</span>
                            </div>
                          );
                        }
                        return (
                          <span className="font-serifHindi font-bold text-slate-950 text-xs sm:text-[13px]">{m.q1_name}</span>
                        );
                      })()}
                    </td>

                    {/* Q.2 Relationship */}
                    <td className="border-r border-slate-700 p-1">
                      <div className="text-[9px] truncate max-w-[65px] mx-auto text-slate-700 font-semibold">
                        {RELATIONSHIP_CODES.find((r) => r.code === Number(m.q2_relationship))?.label?.replace(/^\d+\s*-\s*/, '')}
                      </div>
                      <DigitBoxes value={m.q2_relationship} count={2} />
                    </td>

                    {/* Q.3 Gender */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q3_gender} />
                    </td>

                    {/* Q.4 DOB & Age */}
                    <td className="border-r border-slate-700 p-1">
                      <div className="font-mono text-[9.5px] font-bold text-slate-900">
                        {m.q4a_dob ? <DateBoxes dobString={m.q4a_dob} /> : <DigitBoxes value="" count={8} />}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[8.5px] text-slate-500 font-bold">आयु: </span>
                        <DigitBoxes value={m.q4b_age} count={3} />
                      </div>
                    </td>

                    {/* Q.5 Marital Status */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q5_marital_status} />
                    </td>

                    {/* Q.6 Age at Marriage */}
                    <td className="border-r border-slate-700 p-1">
                      {Number(m.q5_marital_status) >= 2 ? (
                        <DigitBoxes value={m.q6_age_at_marriage} count={2} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.7 Spouse S.No */}
                    <td className="border-r border-slate-700 p-1">
                      {m.q7_spouse_serial_no ? (
                        <DigitBoxes value={m.q7_spouse_serial_no} count={2} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.8 Nationality */}
                    <td className="border-r border-slate-700 p-1 font-mono text-[10px]">
                      {m.q8_nationality === 'भारत' ? 'भारत' : '99'}
                    </td>

                    {/* Q.9 Religion */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q9_religion} />
                      {m.q9_religion === 7 && m.q9_religion_other && (
                        <div className="text-[8.5px] truncate text-slate-600">{m.q9_religion_other}</div>
                      )}
                    </td>

                    {/* Q.10 Caste / SC / ST */}
                    <td className="border-r border-slate-700 p-1 text-left text-[9.5px]">
                      <div className="font-black text-slate-900">
                        {m.q10a_sc_st === 1 ? 'अ.जा. (SC)' : m.q10a_sc_st === 2 ? 'अ.ज.जा. (ST)' : 'अन्य'}
                      </div>
                      <div className="text-[9px] text-slate-700 truncate max-w-[90px] font-bold">
                        {m.q10c_caste_name || m.q10b_caste_code || '—'}
                      </div>
                    </td>

                    {/* Q.11 Father Details */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px]">
                      {m.q11_father_in_hh && m.q11_father_serial_no ? (
                        <div>
                          <span className="text-[8.5px] font-bold text-blue-900">परिवार में क्र.</span>
                          <DigitBoxes value={m.q11_father_serial_no} count={2} className="block mt-0.5 mx-auto" />
                        </div>
                      ) : (
                        <div>
                          <span className="truncate block max-w-[85px] font-bold mx-auto">{m.q11_father_name || '—'}</span>
                          {m.q11_father_name && (
                            <span className="text-[8px] text-slate-500 block">
                              {m.q11_father_alive ? 'जीवित' : 'दिवंगत'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Q.12 Mother Details */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px]">
                      {m.q12_mother_in_hh && m.q12_mother_serial_no ? (
                        <div>
                          <span className="text-[8.5px] font-bold text-blue-900">परिवार में क्र.</span>
                          <DigitBoxes value={m.q12_mother_serial_no} count={2} className="block mt-0.5 mx-auto" />
                        </div>
                      ) : (
                        <div>
                          <span className="truncate block max-w-[85px] font-bold mx-auto">{m.q12_mother_name || '—'}</span>
                          {m.q12_mother_name && (
                            <span className="text-[8px] text-slate-500 block">
                              {m.q12_mother_alive ? 'जीवित' : 'दिवंगत'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Q.13 Disability */}
                    <td className="border-r border-slate-700 p-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[8.5px] font-bold text-slate-500">क:</span>
                        <SingleBox value={m.q13a_disabled} />
                      </div>
                      {m.q13a_disabled === 1 && (
                        <div className="mt-0.5 flex items-center justify-center gap-0.5">
                          <span className="text-[8.5px] font-bold text-slate-500">ख:</span>
                          {(m.q13b_disability_types || []).slice(0, 3).map((code, cIdx) => (
                            <span key={cIdx} className="w-3.5 h-3.5 border border-blue-900 bg-blue-50 font-mono text-[9px] font-black flex items-center justify-center text-blue-900">
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Q.14 Languages */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px]">
                      <div className="font-bold truncate max-w-[75px] mx-auto">{m.q14a_mother_tongue || 'हिन्दी'}</div>
                      {m.q14b_other_languages && (
                        <div className="text-[8.5px] text-slate-500 truncate max-w-[75px] mx-auto">
                          {Array.isArray(m.q14b_other_languages) ? m.q14b_other_languages.join(', ') : m.q14b_other_languages}
                        </div>
                      )}
                    </td>

                    {/* Q.15 Literacy */}
                    <td className="border-r border-slate-700 p-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[8.5px]">क:</span>
                        <SingleBox value={m.q15a_literacy} />
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-[8.5px]">ख:</span>
                        <SingleBox value={m.q15b_digital_literate} />
                      </div>
                    </td>

                    {/* Q.16 Education Institution */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q16_education_status} />
                    </td>

                    {/* Q.17 Education Level & Subject */}
                    <td className="p-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[8.5px]">क:</span>
                        <DigitBoxes value={m.q17a_highest_education} count={2} />
                      </div>
                      {Number(m.q17a_highest_education) >= 11 && (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-[8.5px]">ख:</span>
                          <SingleBox value={m.q17b_subject} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SIDE B TABLE (Questions 18 to 40) ── */}
      {side === 'B' && (
        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full border-collapse text-center text-[10px] sm:text-[10.5px]">
            <thead>
              <tr
                className={`border-b-2 font-black leading-tight ${
                  isDraft ? 'bg-red-200/90 border-red-800 text-red-950' : 'bg-slate-200 border-slate-900 text-slate-950'
                }`}
              >
                <th className="border-r border-slate-700 p-1 w-7">क्र.</th>
                <th className="border-r border-slate-700 p-1 min-w-[100px]">नाम (साइड A से)</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.18 काम</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.19 श्रेणी</th>
                <th className="border-r border-slate-700 p-1 min-w-[75px]">Q.20 व्यवसाय</th>
                <th className="border-r border-slate-700 p-1 min-w-[75px]">Q.21 उद्योग/सेवा</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.22 वर्ग</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.23 गैर-आर्थिक</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.24 तलाश</th>
                <th className="border-r border-slate-700 p-1 w-20">Q.25 यात्रा [क, ख, ग]</th>
                <th className="border-r border-slate-700 p-1 w-20">Q.26 जन्म स्थान</th>
                <th className="border-r border-slate-700 p-1 w-20">Q.27 पूर्व निवास</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.28 कारण</th>
                <th className="border-r border-slate-700 p-1 w-12">Q.29 अवधि</th>
                <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.30 स्थायी पता</th>
                <th className="border-r border-slate-700 p-1 w-20">Q.31-33 प्रजनन [31 जीवित, 32 कुल]</th>
                <th className="border-r border-slate-700 p-1 w-14">Q.34 कोविड</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.35 बैंक</th>
                <th className="border-r border-slate-700 p-1 w-22">Q.36 मोबाइल (10)</th>
                <th className="border-r border-slate-700 p-1 w-26">Q.37 आधार (12)</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.38 EPIC</th>
                <th className="border-r border-slate-700 p-1 w-11">Q.39 पासपोर्ट</th>
                <th className="p-1 w-11">Q.40 DL</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr className="border-b border-slate-300 h-13">
                  <td className="border-r border-slate-400 font-bold font-mono text-slate-400 bg-slate-50">1</td>
                  <td className="border-r border-slate-300 text-center text-slate-400 text-xs italic py-4" colSpan={22}>
                    परिवार में कोई सदस्य दर्ज नहीं है
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
                  const rowNum = m.serial_no || idx + 1;
                  return (
                    <tr key={m.local_id || idx} className="border-b border-slate-800 font-medium h-13 hover:bg-amber-50/30">
                      {/* S.No */}
                      <td className="border-r border-slate-700 p-1 font-black font-mono bg-slate-100">{rowNum}</td>

                    {/* Name (Bilingual Hindi & English) */}
                    <td className="border-r border-slate-700 p-1 font-bold text-left text-slate-950">
                      {(() => {
                        const b = formatBilingualName(m.q1_name);
                        if (b.isTransliterated) {
                          return (
                            <div className="flex flex-col leading-tight">
                              <span className="font-serifHindi font-bold text-slate-950 text-xs sm:text-[13px]">{b.hindi}</span>
                              <span className="text-[9.5px] text-slate-500 font-mono font-medium tracking-tight uppercase print:text-black">{b.english}</span>
                            </div>
                          );
                        }
                        return (
                          <span className="font-serifHindi font-bold text-slate-950 text-xs sm:text-[13px]">{m.q1_name}</span>
                        );
                      })()}
                    </td>

                    {/* Q.18 Work Status */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q18_work_last_year} />
                    </td>

                    {/* Q.19 Activity Category */}
                    <td className="border-r border-slate-700 p-1">
                      {m.q18_work_last_year <= 3 ? (
                        <SingleBox value={m.q19_economic_activity} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.20 Occupation (Only for Q.19 >= 3 per Flowchart) */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px] text-left truncate max-w-[80px]">
                      {m.q18_work_last_year <= 3 && m.q19_economic_activity >= 3 ? (
                        m.q20_occupation || '—'
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.21 Industry (Only for Q.19 >= 3 per Flowchart) */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px] text-left truncate max-w-[80px]">
                      {m.q18_work_last_year <= 3 && m.q19_economic_activity >= 3 ? (
                        m.q21_industry || '—'
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.22 Worker Class (Only for Q.19 >= 3 per Flowchart) */}
                    <td className="border-r border-slate-700 p-1">
                      {m.q18_work_last_year <= 3 && m.q19_economic_activity >= 3 ? (
                        <SingleBox value={m.q22_worker_class} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.23 Non-Economic (For Codes 2, 3 Marginal and Code 4 Non-Worker) */}
                    <td className="border-r border-slate-700 p-1">
                      {m.q18_work_last_year >= 2 ? (
                        <SingleBox value={m.q23_non_economic_activity} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.24 Seeking Work (For Codes 2, 3 Marginal and Code 4 Non-Worker) */}
                    <td className="border-r border-slate-700 p-1">
                      {m.q18_work_last_year >= 2 ? (
                        <SingleBox value={m.q24_seeking_work} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.25 Commute (Only for Workers 1, 2, 3) */}
                    <td className="border-r border-slate-700 p-1 text-[9px]">
                      {m.q18_work_last_year <= 3 ? (
                        <>
                          <div className="flex items-center justify-center gap-1">
                            <span>क:</span> <DigitBoxes value={m.q25a_travel_distance_km || '0'} count={2} />
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span>ग:</span> <SingleBox value={m.q25c_travel_mode} />
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.26 Birth Place */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px]">
                      {m.q26_birth_place_type === 'here' ? (
                        <span className="font-bold text-emerald-800">यहीं [✓]</span>
                      ) : (
                        <span className="truncate block max-w-[75px]">{m.q26_birth_place_details || 'अन्यत्र'}</span>
                      )}
                    </td>

                    {/* Q.27 Last Residence */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px]">
                      {m.q27_last_residence_type === 'here' ? (
                        <span className="font-bold text-emerald-800">यहीं [✓]</span>
                      ) : (
                        <span className="truncate block max-w-[75px]">{m.q27_last_residence_details || 'अन्यत्र'}</span>
                      )}
                    </td>

                    {/* Q.28 Migration Reason */}
                    <td className="border-r border-slate-700 p-1">
                      {m.q27_last_residence_type !== 'here' ? (
                        <SingleBox value={m.q28_migration_reason} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.29 Duration */}
                    <td className="border-r border-slate-700 p-1">
                      <DigitBoxes value={m.q29_residence_duration_years || '00'} count={2} />
                    </td>

                    {/* Q.30 Permanent Address */}
                    <td className="border-r border-slate-700 p-1 text-[9.5px] text-left">
                      {m.q30_permanent_address_same ? (
                        <span className="font-bold text-slate-700">समान [✓]</span>
                      ) : (
                        <span className="truncate block max-w-[85px]">{m.q30_permanent_address || '—'}</span>
                      )}
                    </td>

                    {/* Q.31-33 Fertility: 31 Surviving (q32), 32 Ever Born (q31), 33 Last 1 Yr */}
                    <td className="border-r border-slate-700 p-1 text-[9px]">
                      {m.q3_gender === 2 && Number(m.q5_marital_status) >= 2 ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1" title="प्र. 31 वर्तमान में जीवित संतानें (कन्या/बालक)">
                            <span className="font-bold text-slate-700">31(जी):</span>
                            <DigitBoxes value={m.q32_children_surviving_female || 0} count={1} />
                            <DigitBoxes value={m.q32_children_surviving_male || 0} count={1} />
                          </div>
                          <div className="flex items-center justify-between gap-1" title="प्र. 32 कभी जीवित जन्मी कुल संतानें (कन्या/बालक)">
                            <span className="font-bold text-slate-700">32(कुल):</span>
                            <DigitBoxes value={m.q31_children_ever_born_female || 0} count={1} />
                            <DigitBoxes value={m.q31_children_ever_born_male || 0} count={1} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Q.34 Covid */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q34a_covid_vaccinated || 1} />
                    </td>

                    {/* Q.35 Bank */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q35_bank_accounts_count || 1} />
                    </td>

                    {/* Q.36 Mobile */}
                    <td className="border-r border-slate-700 p-1">
                      <DigitBoxes value={m.q36_mobile_number || ''} count={10} />
                    </td>

                    {/* Q.37 Aadhaar */}
                    <td className="border-r border-slate-700 p-1 font-mono text-[9px]">
                      {m.q37_aadhaar_number && m.q37_aadhaar_number !== 'नहीं' ? (
                        <DigitBoxes value={m.q37_aadhaar_number} count={12} />
                      ) : (
                        <span className="text-slate-400">नहीं</span>
                      )}
                    </td>

                    {/* Q.38 EPIC */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q38_voter_id_epic ? '1' : '2'} />
                    </td>

                    {/* Q.39 Passport */}
                    <td className="border-r border-slate-700 p-1">
                      <SingleBox value={m.q39_passport_number ? '1' : '2'} />
                    </td>

                    {/* Q.40 DL */}
                    <td className="p-1">
                      <SingleBox value={m.q40_driving_license || 2} />
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Official Footer ── */}
      <div
        className={`mt-2 border-t pt-1.5 flex items-center justify-between text-[10px] font-bold ${
          isDraft ? 'border-red-400 text-red-950 bg-red-100/70 p-2 rounded' : 'border-slate-600 text-slate-700'
        }`}
      >
        <div>
          {isDraft && (
            <span className="text-red-700 font-black">
              ⚠️ ड्राफ्ट प्रतिलिपि: सत्यापन शेष • कृपया अंतिम समझकर लॉक न करें &nbsp;|&nbsp;
            </span>
          )}
          प्रगणक हस्ताक्षर: ____________________ &nbsp;|&nbsp; दिनांक: {new Date().toLocaleDateString('en-GB')}
        </div>
        <div className="font-mono text-slate-900">
          भवन #{household.building_no} • मकान #{household.census_house_no} • परिवार #{household.household_no} ({household.head_name || 'अज्ञात'})
        </div>
      </div>
    </div>
  );
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * Main RegisterBookView: Standalone Page for `/panjika` slug
 * ══════════════════════════════════════════════════════════════════════
 */
export default function RegisterBookView({ settings, onBack, isReadOnly = false }) {
  const [households, setHouseholds] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [sectionsList, setSectionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & display state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [viewSide, setViewSide] = useState('BOTH'); // 'A', 'B', or 'BOTH'
  const [viewMode, setViewMode] = useState('all'); // 'all' (continuous scroll) or 'book' (single family book)
  const [activeBookIndex, setActiveBookIndex] = useState(0);

  // Secure Share Link Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [shareSlug, setShareSlug] = useState(settings?.register_share_slug || 'panjika-mathura');
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugSavedMsg, setSlugSavedMsg] = useState('');

  useEffect(() => {
    if (settings?.register_share_slug) {
      setShareSlug(settings.register_share_slug);
    }
  }, [settings?.register_share_slug]);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}#/panjika?token=${shareSlug}`;
  };

  const handleCopyShareLink = () => {
    const url = getShareUrl();
    if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleSaveSlug = async () => {
    const cleaned = (shareSlug || 'panjika-mathura')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    setIsSavingSlug(true);
    try {
      const activeSettings = (await db.settings.get('active_settings')) || {};
      const updated = {
        ...activeSettings,
        id: 'active_settings',
        register_share_slug: cleaned,
        updated_at: new Date().toISOString()
      };
      await db.settings.put(updated);
      setShareSlug(cleaned);
      setSlugSavedMsg('सुरक्षा स्लग सफलतापूर्वक अपडेट किया गया! ✓');
      setTimeout(() => setSlugSavedMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save register slug:', err);
    } finally {
      setIsSavingSlug(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const activeSettings = settings || (await db.settings.get('active_settings'));
        if (activeSettings?.sections) setSectionsList(activeSettings.sections || []);

        let hhs = await db.households.toArray();
        // Sort strictly by building_no -> census_house_no -> household_no
        hhs.sort((a, b) => {
          const ba = String(a.building_no || '').padStart(5, '0');
          const bb = String(b.building_no || '').padStart(5, '0');
          if (ba !== bb) return ba.localeCompare(bb);

          const ca = String(a.census_house_no || '').padStart(5, '0');
          const cb = String(b.census_house_no || '').padStart(5, '0');
          if (ca !== cb) return ca.localeCompare(cb);

          return String(a.household_no || '').padStart(5, '0').localeCompare(String(b.household_no || '').padStart(5, '0'));
        });

        setHouseholds(hhs);

        // Load all members and group by household_local_id
        const allMembers = await db.members.toArray();
        const map = {};
        for (const m of allMembers) {
          const hhId = m.household_local_id;
          if (!hhId) continue;
          if (!map[hhId]) map[hhId] = [];
          map[hhId].push(m);
        }

        // Sort members by serial_no
        for (const k of Object.keys(map)) {
          map[k].sort((a, b) => (Number(a.serial_no) || 0) - (Number(b.serial_no) || 0));
        }

        setMembersMap(map);
      } catch (err) {
        console.error('Panjika load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [settings]);

  // Filter households with bilingual search (searches Hindi and English seamlessly)
  const filtered = households.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return selectedSection === 'all' || String(h.village_section) === selectedSection;
    }
    const qHindi = transliterateEnglishToHindi(q);
    const matchesSearch =
      (h.head_name && (h.head_name.toLowerCase().includes(q) || (qHindi && h.head_name.includes(qHindi)))) ||
      String(h.building_no).includes(q) ||
      String(h.census_house_no).includes(q) ||
      String(h.household_no).includes(q) ||
      (h.se_id && h.se_id.toLowerCase().includes(q)) ||
      (membersMap[h.local_id] || []).some((m) => {
        if (!m.q1_name) return false;
        const nLow = m.q1_name.toLowerCase();
        const nHindi = transliterateEnglishToHindi(m.q1_name);
        return nLow.includes(q) || nHindi.includes(q) || (qHindi && (nLow.includes(qHindi) || nHindi.includes(qHindi)));
      });

    const matchesSection =
      selectedSection === 'all' || String(h.village_section) === selectedSection;

    return matchesSearch && matchesSection;
  });

  const totalMembersCount = filtered.reduce((acc, h) => {
    return acc + (membersMap[h.local_id]?.length || h.total_members || 0);
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 select-none">
      {/* ── DEDICATED STANDALONE PANJIKA TOP BAR (Hidden during Print) ── */}
      <header className="sticky top-0 z-40 bg-[#0B3B60] text-white shadow-xl print:hidden border-b-2 border-amber-400">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Brand & Back Button / Read-Only Badge */}
          <div className="flex items-center gap-3">
            {isReadOnly ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-xs sm:text-sm border border-emerald-400/40 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>अधिकृत पठन मोड (Read-Only)</span>
              </div>
            ) : (
              onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm transition-all border border-white/20 active:scale-95"
                  title="मुख्य ऐप पर वापस जाएँ"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ऐप पर लौटें</span>
                </button>
              )
            )}

            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <h1 className="text-sm sm:text-base font-black leading-tight flex items-center gap-2">
                  <span>परिवार पंजिका (Census Register Book)</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                    SLUG: /panjika
                  </span>
                </h1>
                <div className="text-[11px] text-slate-300">
                  कुल प्रविष्टियाँ: <strong className="text-white">{filtered.length} परिवार</strong> | कुल सदस्य: <strong className="text-white">{totalMembersCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Search, Filter, Mode & Print */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="भवन / मकान / मुखिया खोजें..."
                className="pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/80 border border-white/20 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 w-44 sm:w-52"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/20 rounded-xl px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="text-slate-900">सभी प्रभाग</option>
                {sectionsList.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Side Selector (Side A / Side B / Both) */}
            <div className="bg-[#072F5F] p-0.5 rounded-xl border border-white/20 flex items-center text-xs font-bold">
              <button
                onClick={() => setViewSide('A')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewSide === 'A' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-200 hover:text-white'
                }`}
              >
                साइड A
              </button>
              <button
                onClick={() => setViewSide('B')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewSide === 'B' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-200 hover:text-white'
                }`}
              >
                साइड B
              </button>
              <button
                onClick={() => setViewSide('BOTH')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewSide === 'BOTH' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-200 hover:text-white'
                }`}
              >
                दोनों साइड (A+B)
              </button>
            </div>

            {/* View Mode (Continuous vs Single Page Flip) */}
            <div className="bg-[#072F5F] p-0.5 rounded-xl border border-white/20 hidden md:flex items-center text-xs font-bold">
              <button
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'all' ? 'bg-white text-slate-900 font-black' : 'text-slate-200 hover:text-white'
                }`}
                title="सभी परिवार एक के बाद एक देखें"
              >
                सतत पंजिका
              </button>
              <button
                onClick={() => setViewMode('book')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'book' ? 'bg-white text-slate-900 font-black' : 'text-slate-200 hover:text-white'
                }`}
                title="एक-एक पृष्ठ पलट कर देखें"
              >
                पुस्तक पृष्ठ
              </button>
            </div>

            {/* Share Read-Only Link (Only for Unlocked Enumerator) */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-amber-300"
                title="सुरक्षित शेयर लिंक (Share Read-Only Register)"
              >
                <Share2 className="w-4 h-4" />
                <span>शेयर लिंक</span>
              </button>
            )}

            {/* Print Official Schedule */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-emerald-400"
            >
              <Printer className="w-4 h-4" />
              <span>प्रपत्र प्रिंट</span>
            </button>
          </div>
        </div>

        {/* Book View Pagination Bar (When Book mode is active) */}
        {viewMode === 'book' && filtered.length > 0 && (
          <div className="bg-[#072F5F] border-t border-white/10 px-4 py-1.5 flex items-center justify-between text-xs">
            <button
              disabled={activeBookIndex === 0}
              onClick={() => setActiveBookIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 font-bold disabled:opacity-40 hover:text-amber-300"
            >
              <ChevronLeft className="w-4 h-4" /> <span>पिछला परिवार</span>
            </button>

            <div className="font-black text-amber-300 flex items-center gap-2">
              <span>
                परिवार {activeBookIndex + 1} / {filtered.length}:
              </span>
              <span className="text-white">
                {filtered[activeBookIndex]?.head_name} (भवन #{filtered[activeBookIndex]?.building_no} • मकान #{filtered[activeBookIndex]?.census_house_no} • प. #{filtered[activeBookIndex]?.household_no})
              </span>
            </div>

            <button
              disabled={activeBookIndex >= filtered.length - 1}
              onClick={() => setActiveBookIndex((prev) => Math.min(filtered.length - 1, prev + 1))}
              className="flex items-center gap-1 font-bold disabled:opacity-40 hover:text-amber-300"
            >
              <span>अगला परिवार</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* ── CONTENT AREA ── */}
      <main className="p-2 sm:p-4 md:p-6 print:p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-10 h-10 border-4 border-[#0B3B60] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-base font-bold text-slate-700">पंजिका प्रपत्र लोड हो रहे हैं...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-300 max-w-lg mx-auto shadow-sm">
            <BookOpen className="w-14 h-14 mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">कोई प्रपत्र नहीं मिला</h2>
            <p className="text-sm text-slate-500 mt-1">खोज शब्द बदलें अथवा मुख्य ऐप से नया परिवार दर्ज करें।</p>
            {isReadOnly ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSection('all');
                }}
                className="mt-4 px-4 py-2 bg-[#0B3B60] text-white rounded-xl text-xs font-bold hover:bg-[#072F5F]"
              >
                फ़िल्टर साफ़ करें
              </button>
            ) : (
              onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-4 px-4 py-2 bg-[#0B3B60] text-white rounded-xl text-xs font-bold hover:bg-[#072F5F]"
                >
                  ऐप पर वापस जाएँ
                </button>
              )
            )}
          </div>
        ) : viewMode === 'book' ? (
          /* Book Mode: Show current single family in full continuous serialization */
          <div className="space-y-4">
            {(() => {
              const h = filtered[activeBookIndex];
              if (!h) return null;
              const mems = membersMap[h.local_id] || [];

              return (
                <div key={h.local_id} className="space-y-4">
                  {(viewSide === 'A' || viewSide === 'BOTH') && (
                    <HouseholdProformaSheet
                      household={h}
                      members={mems}
                      settings={settings}
                      side="A"
                    />
                  )}
                  {(viewSide === 'B' || viewSide === 'BOTH') && (
                    <HouseholdProformaSheet
                      household={h}
                      members={mems}
                      settings={settings}
                      side="B"
                    />
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          /* Continuous Register Mode: Show all filtered families in complete continuity */
          <div className="space-y-6">
            {filtered.map((h, hIdx) => {
              const mems = membersMap[h.local_id] || [];

              return (
                <div key={h.local_id || hIdx} className="space-y-4">
                  {/* Visual separation banner between households */}
                  <div
                    className={`max-w-[1280px] mx-auto flex items-center justify-between text-xs font-bold px-2.5 py-1 rounded-lg print:hidden ${
                      h.status === 'draft'
                        ? 'bg-red-100 border border-red-300 text-red-950 shadow-2xs'
                        : 'text-slate-600 bg-slate-100/70 border border-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {h.status === 'draft' ? (
                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow-2xs">
                          ✎ ड्राफ्ट (अधूरा)
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow-2xs">
                          ✓ पूर्ण
                        </span>
                      )}
                      <span>
                        क्रमांक #{hIdx + 1} • मुखिया: <strong>{h.head_name}</strong>
                      </span>
                    </span>
                    <span>
                      भवन: <strong>{h.building_no}</strong> | मकान: <strong>{h.census_house_no}</strong> | परिवार: <strong>{h.household_no}</strong> | कुल सदस्य: <strong className={h.status === 'draft' ? 'text-red-900 font-black' : 'text-slate-900 font-black'}>{mems.length}</strong>
                    </span>
                  </div>

                  {(viewSide === 'A' || viewSide === 'BOTH') && (
                    <HouseholdProformaSheet
                      household={h}
                      members={mems}
                      settings={settings}
                      side="A"
                    />
                  )}
                  {(viewSide === 'B' || viewSide === 'BOTH') && (
                    <HouseholdProformaSheet
                      household={h}
                      members={mems}
                      settings={settings}
                      side="B"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── SECURE SHARE REGISTER MODAL ── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0B3B60] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    परिवार पंजिका सुरक्षित शेयर लिंक
                  </h3>
                  <p className="text-xs text-sky-200 mt-0.5">
                    केवल पठन मोड (Read-Only) • डेटा सुरक्षित
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 text-slate-800">
              {/* Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-emerald-950 block">सुरक्षित दृश्य गारंटी:</span>
                  <p className="text-[11.5px] leading-relaxed text-emerald-800">
                    इस लिंक से कोई भी अधिकारी या दर्शक पूरी परिवार पंजिका <strong>केवल देख व प्रिंट</strong> कर सकेंगे। वे मुख्य ऐप, नया परिवार फॉर्म या कोई भी संपादन (Edit) नहीं कर सकते।
                  </p>
                </div>
              </div>

              {/* Shareable URL Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  शेयर करने हेतु सीधा वेब लिंक:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    className="flex-1 px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-xs ${
                      copiedShare
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#0B3B60] hover:bg-[#072F5F] text-white active:scale-95'
                    }`}
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>कॉपी हो गया!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>लिंक कॉपी करें</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Slug Customization */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#0B3B60]" />
                    <span>पंजिका सुरक्षा कोड (Security Slug / Token):</span>
                  </label>
                  {slugSavedMsg && (
                    <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in">
                      {slugSavedMsg}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareSlug}
                    onChange={(e) => setShareSlug(e.target.value)}
                    placeholder="उदा. panjika-mathura"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3B60]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSlug}
                    disabled={isSavingSlug}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 active:scale-95 transition-all"
                  >
                    {isSavingSlug ? 'सहेज रहे हैं...' : 'स्लग बदलें'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  यदि आप यह स्लग बदलते हैं, तो पुराना लिंक अप्रभावी हो जाएगा और केवल नए स्लग वाला लिंक काम करेगा।
                </p>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Print Specific CSS (Guaranteed Landscape on A4) ── */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 6mm;
        }
        @media print {
          html, body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .proforma-sheet {
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 0 !important;
            border-width: 2px !important;
            border-color: black !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
