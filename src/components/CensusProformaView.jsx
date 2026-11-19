import React, { useState } from 'react';
import { Printer, X, Download, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
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

/**
 * Renders individual character / digit boxes matching the official Census PDF schedule.
 */
function DigitBoxes({ value, count = 1, className = '' }) {
  const str = String(value || '').replace(/\D/g, '');
  const padded = str.padStart(count, ' ');
  const chars = padded.slice(-count).split('');

  return (
    <div className={`inline-flex border border-slate-700 bg-white ${className}`}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="w-4 h-5 sm:w-4.5 sm:h-5.5 border-r last:border-r-0 border-slate-400 font-mono text-[11px] sm:text-xs font-black flex items-center justify-center text-slate-900 leading-none"
        >
          {char.trim() || ''}
        </span>
      ))}
    </div>
  );
}

/**
 * Single cell box for 1/2 or single-digit code
 */
function SingleBox({ value, emptyDash = true }) {
  const val = value !== undefined && value !== null && value !== '' ? String(value) : (emptyDash ? '—' : '');
  return (
    <span className="w-5 h-5 border border-slate-700 font-mono text-xs font-black flex items-center justify-center bg-white text-slate-900 mx-auto">
      {val}
    </span>
  );
}

export default function CensusProformaView({
  isOpen,
  onClose,
  household,
  members = [],
  settings = null
}) {
  const [activeSide, setActiveSide] = useState('A'); // 'A' or 'B'
  const [pageIndex, setPageIndex] = useState(0); // For pagination if members > 6

  if (!isOpen || !household) return null;

  const MEMBERS_PER_SHEET = 6;
  const totalSheets = Math.max(1, Math.ceil(members.length / MEMBERS_PER_SHEET));
  const currentMembers = members.slice(pageIndex * MEMBERS_PER_SHEET, (pageIndex + 1) * MEMBERS_PER_SHEET);
  // Pad to 6 rows to match the official pre-printed schedule
  const paddedMembers = [...currentMembers];
  while (paddedMembers.length < MEMBERS_PER_SHEET) {
    paddedMembers.push(null);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex flex-col font-['Hind'] overflow-hidden">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-[#0B3B60] text-white px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md print:hidden">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-amber-300" />
          <div>
            <h2 className="text-sm sm:text-base font-extrabold leading-tight">
              आधिकारिक परिवार प्रपत्र (Official Census Schedule)
            </h2>
            <div className="text-xs text-slate-200">
              परिवार #{household.household_no} | मुखिया: {household.head_name || 'अज्ञात'} | कुल सदस्य: {members.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Side A / Side B Selector */}
          <div className="bg-[#072F5F] p-0.5 rounded-lg flex items-center border border-white/20">
            <button
              onClick={() => setActiveSide('A')}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all ${
                activeSide === 'A' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              साइड - A (प्र. 1 से 17)
            </button>
            <button
              onClick={() => setActiveSide('B')}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all ${
                activeSide === 'B' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              साइड - B (प्र. 18 से 40)
            </button>
          </div>

          {/* Sheet Pagination if > 6 members */}
          {totalSheets > 1 && (
            <div className="flex items-center gap-1 bg-[#072F5F] px-2 py-1 rounded-lg border border-white/20 text-xs">
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => p - 1)}
                className="disabled:opacity-40 p-0.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold">पृष्ठ {pageIndex + 1}/{totalSheets}</span>
              <button
                disabled={pageIndex >= totalSheets - 1}
                onClick={() => setPageIndex((p) => p + 1)}
                className="disabled:opacity-40 p-0.5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-black shadow-sm active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट / PDF सेव करें</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="flex-1 overflow-auto bg-slate-200/90 p-2 sm:p-6 flex justify-center">
        <div
          id="census-print-container"
          className="bg-white text-slate-950 w-full max-w-[1250px] shadow-2xl p-4 sm:p-6 border border-slate-400 print:border-0 print:shadow-none print:m-0 print:p-2 text-[11px] leading-tight select-text"
        >
          {/* ===================== SIDE A ===================== */}
          {activeSide === 'A' && (
            <div className="space-y-2">
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-1.5">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-700">
                  भारत सरकार • GOVERNMENT OF INDIA
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wide uppercase">
                  परिवार प्रपत्र (HOUSEHOLD SCHEDULE)
                </h1>
                <div className="text-[11px] font-bold text-slate-600">
                  गृह मंत्रालय | महारजिस्ट्रार एवं जनगणना आयुक्त का कार्यालय (ORGI)
                </div>
              </div>

              {/* Location & Household Identification Ribbon (Matching Schedule Top) */}
              <div className="border border-slate-900 p-2 bg-slate-50/50 space-y-1.5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-300 pb-1.5">
                  <div>
                    <span className="font-bold">राज्य/संघ राज्य: </span>
                    <span className="font-black">{household.state_name || settings?.state_name}</span>
                    <DigitBoxes value={household.state_code || '09'} count={2} className="ml-1.5" />
                  </div>
                  <div>
                    <span className="font-bold">जिला: </span>
                    <span className="font-black">{household.district_name || settings?.district_name}</span>
                    <DigitBoxes value={household.district_code || '14'} count={2} className="ml-1.5" />
                  </div>
                  <div>
                    <span className="font-bold">तहसील/ब्लॉक: </span>
                    <span className="font-black">{household.tehsil_block || settings?.tehsil_block}</span>
                    <DigitBoxes value={household.tehsil_code || '001'} count={3} className="ml-1.5" />
                  </div>
                  <div>
                    <span className="font-bold">ग्राम/वार्ड: </span>
                    <span className="font-black">{household.ward_village_name || settings?.ward_village_name}</span>
                    <DigitBoxes value={household.village_code || settings?.village_code || '001'} count={3} className="ml-1.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5 text-[11px]">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold">भवन संख्या: </span>
                      <DigitBoxes value={household.building_no} count={3} />
                    </div>
                    <div>
                      <span className="font-bold">जनगणना मकान सं.: </span>
                      <DigitBoxes value={household.census_house_no} count={3} />
                    </div>
                    <div>
                      <span className="font-bold">परिवार संख्या: </span>
                      <DigitBoxes value={household.household_no} count={3} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold">प्रकार (1-सा., 2-सं., 3-बेघर): </span>
                      <SingleBox value={household.household_type || 1} />
                    </div>
                    <div>
                      <span className="font-bold">कुल सदस्य: </span>
                      <DigitBoxes value={household.is_self_enumerated ? (household.total_members || 1) : members.length} count={2} />
                    </div>
                    {/* Official SE ID digit boxes (स्ट. गणना आईडी) */}
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 border border-slate-700 rounded">
                      <span className="font-bold text-[10px]">स्ट. गणना आईडी: </span>
                      <span className="inline-flex border border-slate-900 bg-white">
                        <span className="w-4 h-5 flex items-center justify-center font-black border-r border-slate-900 bg-amber-200 text-[10px]">
                          P
                        </span>
                        {Array.from({ length: 10 }).map((_, i) => {
                          const digits = (household.se_id || '').replace(/^P/i, '');
                          return (
                            <span
                              key={i}
                              className="w-3.5 h-5 border-r last:border-r-0 border-slate-900 flex items-center justify-center font-mono font-bold text-[10px]"
                            >
                              {digits[i] || ''}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 border border-slate-300 rounded font-black">
                      SIDE - A (प्र. 1 से 17)
                    </div>
                  </div>
                </div>
              </div>

              {/* Side A Main Grid Table */}
              <div className="overflow-x-auto border-2 border-slate-900">
                <table className="w-full border-collapse text-center text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-900 font-black text-slate-950">
                      <th className="border-r border-slate-700 p-1 w-7">क्र. सं.</th>
                      <th className="border-r border-slate-700 p-1 min-w-[110px]">Q.1 व्यक्ति का नाम</th>
                      <th className="border-r border-slate-700 p-1 w-16">Q.2 सम्बन्ध [कोड]</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.3 लिंग</th>
                      <th className="border-r border-slate-700 p-1 w-28">Q.4 जन्म तिथि व आयु</th>
                      <th className="border-r border-slate-700 p-1 w-14">Q.5 स्थिति</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.6 वि.आयु</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.7 क्र.सं.</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.8 राष्ट्र</th>
                      <th className="border-r border-slate-700 p-1 w-14">Q.9 धर्म</th>
                      <th className="border-r border-slate-700 p-1 min-w-[90px]">Q.10 जाति / SC / ST</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.11 पिता विवरण</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.12 माता विवरण</th>
                      <th className="border-r border-slate-700 p-1 w-20">Q.13 दिव्यांगता [क][ख: 1,2,3]</th>
                      <th className="border-r border-slate-700 p-1 w-20">Q.14 भाषाएँ</th>
                      <th className="border-r border-slate-700 p-1 w-16">Q.15 साक्षर</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.16 शिक्षा</th>
                      <th className="p-1 w-16">Q.17 स्तर व विषय</th>
                    </tr>
                  </thead>
                  <tbody>
                    {household.is_self_enumerated && members.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="p-8 text-center bg-amber-50/70 border-b border-slate-900">
                          <div className="max-w-lg mx-auto space-y-2">
                            <span className="inline-block px-3 py-1 bg-amber-200 text-amber-950 font-black rounded-full text-xs uppercase tracking-wide border border-amber-400">
                              ✓ स्व-गणना प्रपत्र (Self-Enumerated Schedule)
                            </span>
                            <h3 className="text-base font-extrabold text-slate-950">
                              परिवार ने se.census.gov.in पोर्टल पर ऑनलाइन स्व-गणना पूर्ण कर ली है
                            </h3>
                            <p className="font-mono font-black text-blue-900 text-sm bg-white p-2 rounded-lg border border-amber-300 inline-block shadow-2xs">
                              स्ट. गणना आईडी (SE ID): {household.se_id || '—'}
                            </p>
                            <p className="text-xs text-slate-600">
                              मुखिया: <strong>{household.head_name}</strong> • कुल सदस्य: <strong>{household.total_members}</strong> • प्रगणक द्वारा सत्यापन अभिलेखित
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paddedMembers.map((m, idx) => {
                      const rowNum = pageIndex * MEMBERS_PER_SHEET + idx + 1;
                      if (!m) {
                        return (
                          <tr key={`empty_${idx}`} className="border-b border-slate-400 h-14">
                            <td className="border-r border-slate-400 font-bold font-mono text-slate-400">{rowNum}</td>
                            <td className="border-r border-slate-400" colSpan={17}></td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={m.local_id || idx} className="border-b border-slate-900 font-medium h-14 hover:bg-blue-50/40">
                          {/* S.No */}
                          <td className="border-r border-slate-700 p-1 font-black font-mono bg-slate-100">{m.serial_no}</td>

                          {/* Q.1 Name */}
                          <td className="border-r border-slate-700 p-1 font-bold text-left text-slate-950">
                            {m.q1_name}
                          </td>

                          {/* Q.2 Relationship */}
                          <td className="border-r border-slate-700 p-1">
                            <div className="text-[10px] truncate max-w-[65px] mx-auto text-slate-700">
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
                            <div className="font-mono text-[10px] font-bold text-slate-800">
                              {m.q4a_dob || '—'}
                            </div>
                            <div className="mt-0.5">
                              <span className="text-[9px] text-slate-500 font-bold">आयु: </span>
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
                              <div className="text-[9px] truncate text-slate-600">{m.q9_religion_other}</div>
                            )}
                          </td>

                          {/* Q.10 Caste / SC / ST */}
                          <td className="border-r border-slate-700 p-1 text-left text-[10px]">
                            <div className="font-bold text-slate-900">
                              {m.q10a_sc_st === 1 ? 'SC' : m.q10a_sc_st === 2 ? 'ST' : 'अन्य'}
                            </div>
                            <div className="text-[9px] text-slate-600 truncate max-w-[85px]">
                              {m.q10c_caste_name || m.q10b_caste_code || '—'}
                            </div>
                          </td>

                          {/* Q.11 Father Details */}
                          <td className="border-r border-slate-700 p-1 text-[10px]">
                            {m.q11_father_in_hh && m.q11_father_serial_no ? (
                              <div>
                                <span className="text-[9px] font-bold text-blue-900">परिवार में क्र.</span>
                                <DigitBoxes value={m.q11_father_serial_no} count={2} className="block mt-0.5" />
                              </div>
                            ) : (
                              <div>
                                <span className="truncate block max-w-[80px] font-bold">{m.q11_father_name || '—'}</span>
                                {m.q11_father_name && (
                                  <span className="text-[8.5px] text-slate-500 block">
                                    {m.q11_father_alive ? 'जीवित' : 'दिवंगत'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Q.12 Mother Details */}
                          <td className="border-r border-slate-700 p-1 text-[10px]">
                            {m.q12_mother_in_hh && m.q12_mother_serial_no ? (
                              <div>
                                <span className="text-[9px] font-bold text-blue-900">परिवार में क्र.</span>
                                <DigitBoxes value={m.q12_mother_serial_no} count={2} className="block mt-0.5" />
                              </div>
                            ) : (
                              <div>
                                <span className="truncate block max-w-[80px] font-bold">{m.q12_mother_name || '—'}</span>
                                {m.q12_mother_name && (
                                  <span className="text-[8.5px] text-slate-500 block">
                                    {m.q12_mother_alive ? 'जीवित' : 'दिवंगत'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Q.13 Disability (Severity Sequence) */}
                          <td className="border-r border-slate-700 p-1">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[9px] font-bold text-slate-500">क:</span>
                              <SingleBox value={m.q13a_disabled} />
                            </div>
                            {m.q13a_disabled === 1 && (
                              <div className="mt-1 flex items-center justify-center gap-0.5">
                                <span className="text-[9px] font-bold text-slate-500">ख:</span>
                                {(m.q13b_disability_types || []).map((code, cIdx) => (
                                  <span key={cIdx} className="w-4 h-4 border border-blue-900 bg-blue-50 font-mono text-[10px] font-black flex items-center justify-center text-blue-900">
                                    {code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Q.14 Languages */}
                          <td className="border-r border-slate-700 p-1 text-[10px]">
                            <div className="font-bold truncate max-w-[75px]">{m.q14a_mother_tongue || 'हिन्दी'}</div>
                            {m.q14b_other_languages && (
                              <div className="text-[9px] text-slate-500 truncate max-w-[75px]">
                                {Array.isArray(m.q14b_other_languages) ? m.q14b_other_languages.join(', ') : m.q14b_other_languages}
                              </div>
                            )}
                          </td>

                          {/* Q.15 Literacy */}
                          <td className="border-r border-slate-700 p-1">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[9px]">क:</span>
                              <SingleBox value={m.q15a_literacy} />
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <span className="text-[9px]">ख:</span>
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
                              <span className="text-[9px]">क:</span>
                              <DigitBoxes value={m.q17a_highest_education} count={2} />
                            </div>
                            {Number(m.q17a_highest_education) >= 11 && (
                              <div className="flex items-center justify-center gap-1 mt-0.5">
                                <span className="text-[9px]">ख:</span>
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

              {/* Instructions footer matching schedule */}
              <div className="border border-slate-400 p-1.5 text-[10px] text-slate-600 bg-slate-50/50 flex justify-between items-center">
                <span>नोट: प्रगणक द्वारा सभी कोड अधिकृत कोड निर्देशिका अनुसार ही भरे जाने हैं।</span>
                <span className="font-bold">पृष्ठ 1 / साइड A समाप्त</span>
              </div>
            </div>
          )}

          {/* ===================== SIDE B ===================== */}
          {activeSide === 'B' && (
            <div className="space-y-2">
              {/* Header for Side B */}
              <div className="border-b-2 border-slate-900 pb-1.5 flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
                    परिवार प्रपत्र — साइड B (SIDE - B)
                  </h1>
                  <div className="text-[11px] font-bold text-slate-600">
                    आर्थिक गतिविधि, प्रवास, प्रजनन, बैंक व पहचान पत्र विवरण (प्र. 18 से 40)
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Official SE ID digit boxes (स्ट. गणना आईडी) */}
                  <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 border border-slate-700 rounded">
                    <span className="font-bold text-[10px]">स्ट. गणना आईडी: </span>
                    <span className="inline-flex border border-slate-900 bg-white">
                      <span className="w-4 h-5 flex items-center justify-center font-black border-r border-slate-900 bg-amber-200 text-[10px]">
                        P
                      </span>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const digits = (household.se_id || '').replace(/^P/i, '');
                        return (
                          <span
                            key={i}
                            className="w-3.5 h-5 border-r last:border-r-0 border-slate-900 flex items-center justify-center font-mono font-bold text-[10px]"
                          >
                            {digits[i] || ''}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-black">
                      भवन #{household.building_no} | मकान #{household.census_house_no} | परिवार #{household.household_no}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      मुखिया: {household.head_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side B Main Grid Table */}
              <div className="overflow-x-auto border-2 border-slate-900">
                <table className="w-full border-collapse text-center text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-900 font-black text-slate-950">
                      <th className="border-r border-slate-700 p-1 w-7">क्र.</th>
                      <th className="border-r border-slate-700 p-1 min-w-[100px]">व्यक्ति का नाम</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.18 काम</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.19 श्रेणी</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.20 व्यवसाय</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.21 उद्योग</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.22 वर्ग</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.23 गैर-आर्थिक</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.24 तलाश</th>
                      <th className="border-r border-slate-700 p-1 w-20">Q.25 यात्रा [किमी|साधन]</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.26 जन्म स्थान</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.27 पूर्व निवास व क्षेत्र</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.28 कारण</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.29 अवधि</th>
                      <th className="border-r border-slate-700 p-1 min-w-[85px]">Q.30 स्थायी पता</th>
                      <th className="border-r border-slate-700 p-1 w-28">प्रजनन Q.31, 32, 33 [पुत्री | पुत्र]</th>
                      <th className="border-r border-slate-700 p-1 w-14">Q.34 कोविड</th>
                      <th className="border-r border-slate-700 p-1 w-12">Q.35 बैंक</th>
                      <th className="border-r border-slate-700 p-1 w-24">Q.36 मोबाइल (10)</th>
                      <th className="border-r border-slate-700 p-1 w-28">Q.37 आधार (12)</th>
                      <th className="border-r border-slate-700 p-1 w-20">Q.38 EPIC</th>
                      <th className="border-r border-slate-700 p-1 w-20">Q.39 पासपोर्ट</th>
                      <th className="p-1 w-12">Q.40 D/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {household.is_self_enumerated && members.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="p-8 text-center bg-amber-50/70 border-b border-slate-900">
                          <div className="max-w-lg mx-auto space-y-2">
                            <span className="inline-block px-3 py-1 bg-amber-200 text-amber-950 font-black rounded-full text-xs uppercase tracking-wide border border-amber-400">
                              ✓ स्व-गणना प्रपत्र (Self-Enumerated Schedule)
                            </span>
                            <h3 className="text-base font-extrabold text-slate-950">
                              परिवार ने se.census.gov.in पोर्टल पर ऑनलाइन स्व-गणना पूर्ण कर ली है
                            </h3>
                            <p className="font-mono font-black text-blue-900 text-sm bg-white p-2 rounded-lg border border-amber-300 inline-block shadow-2xs">
                              स्ट. गणना आईडी (SE ID): {household.se_id || '—'}
                            </p>
                            <p className="text-xs text-slate-600">
                              मुखिया: <strong>{household.head_name}</strong> • कुल सदस्य: <strong>{household.total_members}</strong> • प्रगणक द्वारा सत्यापन अभिलेखित
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paddedMembers.map((m, idx) => {
                      const rowNum = pageIndex * MEMBERS_PER_SHEET + idx + 1;
                      if (!m) {
                        return (
                          <tr key={`empty_b_${idx}`} className="border-b border-slate-400 h-14">
                            <td className="border-r border-slate-400 font-bold font-mono text-slate-400">{rowNum}</td>
                            <td className="border-r border-slate-400" colSpan={22}></td>
                          </tr>
                        );
                      }

                      const isEverMarriedFemale = Number(m.q3_gender) === 2 && Number(m.q5_marital_status) >= 2;

                      return (
                        <tr key={m.local_id || idx} className="border-b border-slate-900 font-medium h-14 hover:bg-amber-50/40">
                          {/* S.No */}
                          <td className="border-r border-slate-700 p-1 font-black font-mono bg-slate-100">{m.serial_no}</td>

                          {/* Name */}
                          <td className="border-r border-slate-700 p-1 font-bold text-left text-slate-950">
                            {m.q1_name}
                          </td>

                          {/* Q.18 Work Status */}
                          <td className="border-r border-slate-700 p-1">
                            <SingleBox value={m.q18_work_last_year} />
                          </td>

                          {/* Q.19 Economic Category */}
                          <td className="border-r border-slate-700 p-1">
                            {Number(m.q18_work_last_year) <= 3 ? (
                              <SingleBox value={m.q19_economic_activity} />
                            ) : <span className="text-slate-300">—</span>}
                          </td>

                          {/* Q.20 Occupation */}
                          <td className="border-r border-slate-700 p-1 text-left text-[10px] truncate max-w-[85px]">
                            {m.q20_occupation || '—'}
                          </td>

                          {/* Q.21 Industry */}
                          <td className="border-r border-slate-700 p-1 text-left text-[10px] truncate max-w-[85px]">
                            {m.q21_industry || '—'}
                          </td>

                          {/* Q.22 Worker Class */}
                          <td className="border-r border-slate-700 p-1">
                            {Number(m.q19_economic_activity) >= 3 ? (
                              <SingleBox value={m.q22_worker_class} />
                            ) : <span className="text-slate-300">—</span>}
                          </td>

                          {/* Q.23 Non-Economic */}
                          <td className="border-r border-slate-700 p-1">
                            {Number(m.q18_work_last_year) >= 2 ? (
                              <SingleBox value={m.q23_non_economic_activity} />
                            ) : <span className="text-slate-300">—</span>}
                          </td>

                          {/* Q.24 Seeking Work */}
                          <td className="border-r border-slate-700 p-1">
                            {Number(m.q18_work_last_year) >= 2 ? (
                              <SingleBox value={m.q24_seeking_work} />
                            ) : <span className="text-slate-300">—</span>}
                          </td>

                          {/* Q.25 Travel Distance / Mode */}
                          <td className="border-r border-slate-700 p-1 text-[10px]">
                            {Number(m.q19_economic_activity) >= 3 ? (
                              <div>
                                <span className="font-bold">{m.q25a_travel_distance_km || 0} km</span>
                                <div className="mt-0.5 flex items-center justify-center gap-1">
                                  <span className="text-[9px]">साधन:</span>
                                  <SingleBox value={m.q25c_travel_mode} />
                                </div>
                              </div>
                            ) : <span className="text-slate-300">—</span>}
                          </td>

                          {/* Q.26 Birth Place */}
                          <td className="border-r border-slate-700 p-1 text-[10px] text-left truncate max-w-[85px]">
                            {m.q26_birth_place_type === 'here' ? (
                              <span className="font-bold text-emerald-800">✓ यहीं</span>
                            ) : (
                              <span>{m.q26_birth_state || m.q26_birth_place_details}</span>
                            )}
                          </td>

                          {/* Q.27 Last Residence & Rural/Urban */}
                          <td className="border-r border-slate-700 p-1 text-[10px] text-left truncate max-w-[85px]">
                            {m.q27_last_residence_type === 'here' ? (
                              <span className="font-bold text-emerald-800">✓ जन्म से यहीं</span>
                            ) : (
                              <div>
                                <span>{m.q27_last_residence_state || m.q27_last_residence_details}</span>
                                <div className="text-[9px] text-slate-500 font-bold">
                                  क्षेत्र: {m.q27b_rural_urban === 2 ? 'शहरी' : 'ग्रामीण'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Q.28 Migration Reason */}
                          <td className="border-r border-slate-700 p-1">
                            {m.q27_last_residence_type !== 'here' ? (
                              <SingleBox value={m.q28_migration_reason} />
                            ) : <span className="text-slate-300">—</span>}
                          </td>

                          {/* Q.29 Duration */}
                          <td className="border-r border-slate-700 p-1">
                            <DigitBoxes value={m.q29_residence_duration_years || '00'} count={2} />
                          </td>

                          {/* Q.30 Permanent Address */}
                          <td className="border-r border-slate-700 p-1 text-[10px] text-left truncate max-w-[85px]">
                            {m.q30_permanent_address_same ? (
                              <span className="font-bold text-emerald-800">✓ समान</span>
                            ) : (
                              <span>{m.q30_permanent_address || '—'}</span>
                            )}
                          </td>

                          {/* Fertility Columns (Q.31 Surviving, Q.32 Ever Born, Q.33 Last 1 Yr) */}
                          <td className="border-r border-slate-700 p-1 text-[9px] leading-tight font-mono">
                            {isEverMarriedFemale ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-bold">31(जीवित):</span>
                                  <span className="font-black">{m.q32_children_surviving_female || 0}पु / {m.q32_children_surviving_male || 0}पु</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-bold">32(कुल):</span>
                                  <span className="font-black">{m.q31_children_ever_born_female || 0}पु / {m.q31_children_ever_born_male || 0}पु</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-bold">33(1वर्ष):</span>
                                  <span className="font-black">{m.q33_children_born_last_year_female || 0}पु / {m.q33_children_born_last_year_male || 0}पु</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-sans text-xs">—</span>
                            )}
                          </td>

                          {/* Q.34 Covid */}
                          <td className="border-r border-slate-700 p-1">
                            <SingleBox value={m.q34a_covid_vaccinated || 1} />
                          </td>

                          {/* Q.35 Bank Account */}
                          <td className="border-r border-slate-700 p-1">
                            <SingleBox value={m.q35_bank_accounts_count || 1} />
                          </td>

                          {/* Q.36 Mobile */}
                          <td className="border-r border-slate-700 p-1 font-mono text-[10px] font-bold">
                            {m.q36_mobile_number || '—'}
                          </td>

                          {/* Q.37 Aadhaar */}
                          <td className="border-r border-slate-700 p-1 font-mono text-[10px] font-bold">
                            {m.q37_aadhaar_number || '—'}
                          </td>

                          {/* Q.38 Voter ID */}
                          <td className="border-r border-slate-700 p-1 font-mono text-[10px] uppercase font-bold">
                            {m.q38_voter_id_epic || '—'}
                          </td>

                          {/* Q.39 Passport */}
                          <td className="border-r border-slate-700 p-1 font-mono text-[10px] uppercase font-bold">
                            {m.q39_passport_number || '—'}
                          </td>

                          {/* Q.40 Driving License */}
                          <td className="p-1">
                            {Number(m.q4b_age) >= 16 ? (
                              <SingleBox value={m.q40_driving_license || 2} />
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>

              {/* Instructions footer matching schedule */}
              <div className="border border-slate-400 p-1.5 text-[10px] text-slate-600 bg-slate-50/50 flex justify-between items-center">
                <span>नोट: प्र. 31-33 के उत्तर सम्बन्धित महिला से सीधे तथा प्र. 36-40 में संख्या सावधानीपूर्वक दर्ज करें।</span>
                <span className="font-bold">साइड B समाप्त | जनगणना प्रगणक हस्ताक्षर: __________________</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
