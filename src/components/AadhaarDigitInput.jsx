import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * AadhaarDigitInput
 * - Fully responsive 12-digit segmented input (3 groups of 4 boxes)
 * - GUARANTEED single-line fit on all mobile screens without ever wrapping to 2 lines
 * - Automatically fills and highlights the last 4 digits from Aadhaar QR code scan (Emerald)
 * - Enumerator verifies last 4 digits and types only the first 8 digits
 * - Auto-advances focus on digit entry
 * - Auto-backspaces across boxes
 * - Supports paste of 12 digits or 8 digits
 * - inputMode="numeric" for mobile keypad
 * - Smart 'नहीं' state toggle
 */
export default function AadhaarDigitInput({
  value = '',
  onChange,
  scannedLast4 = '',
  disabled = false,
  error = ''
}) {
  const isUnavailable = value === 'नहीं' || value === 'उपलब्ध नहीं';
  const inputRefs = useRef([]);

  // Local state for 12 digit boxes
  const [digits, setDigits] = useState(() => {
    const arr = Array(12).fill('');
    const clean = String(value || '').replace(/\D/g, '').slice(0, 12);
    if (clean.length === 12) {
      return clean.split('');
    }
    if (scannedLast4 && scannedLast4.length === 4) {
      for (let i = 0; i < 4; i++) {
        arr[8 + i] = scannedLast4[i];
      }
    }
    return arr;
  });

  // Sync with incoming value or scannedLast4
  useEffect(() => {
    if (isUnavailable) return;

    const clean = String(value || '').replace(/\D/g, '').slice(0, 12);
    if (clean.length === 12) {
      setDigits(clean.split(''));
    } else if (!value) {
      // If value is empty, prefill last 4 from QR if available
      const arr = Array(12).fill('');
      if (scannedLast4 && scannedLast4.length === 4) {
        for (let i = 0; i < 4; i++) {
          arr[8 + i] = scannedLast4[i];
        }
      }
      setDigits(arr);
    }
  }, [value, scannedLast4, isUnavailable]);

  const handleBoxChange = (index, char) => {
    if (disabled || isUnavailable) return;
    const clean = char.replace(/\D/g, '');
    if (!clean && char !== '') return;

    const nextDigit = clean ? clean.slice(-1) : '';
    const newDigits = [...digits];
    newDigits[index] = nextDigit;
    setDigits(newDigits);

    // Notify parent
    const filledCount = newDigits.filter(Boolean).length;
    if (filledCount === 12) {
      onChange(newDigits.join(''));
    } else if (filledCount === 0) {
      onChange('');
    } else {
      onChange(newDigits.join(''));
    }

    // Auto-advance to next box if digit was entered
    if (nextDigit && index < 11) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled || isUnavailable) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box empty, jump to previous box, clear it, and focus
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 11) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (disabled || isUnavailable) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 12);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    onChange(newDigits.join(''));

    const nextIndex = Math.min(11, pasted.length);
    inputRefs.current[nextIndex]?.focus();
  };

  // ── Render Unavailable State ──
  if (isUnavailable) {
    return (
      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-100 border border-slate-300 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-700">
            आधार उपलब्ध नहीं है (प्रपत्र में <strong className="text-slate-900">'नहीं'</strong> दर्ज होगा)
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-[#0B3B60] shadow-xs active:scale-95 transition-all shrink-0 ml-2"
        >
          + दर्ज करें
        </button>
      </div>
    );
  }

  const renderBox = (index) => {
    const isFromQR = index >= 8 && scannedLast4 && scannedLast4.length === 4;
    const isFilled = !!digits[index];

    return (
      <input
        key={index}
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        value={digits[index] || ''}
        onChange={(e) => handleBoxChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        onPaste={handlePaste}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        aria-label={`आधार अंक ${index + 1}`}
        className={`flex-1 min-w-0 h-9 xs:h-10 sm:h-11 text-center font-mono text-xs xs:text-sm sm:text-base font-black rounded sm:rounded-lg border transition-all focus:outline-none focus:ring-1 sm:focus:ring-2 p-0 select-all ${
          isFromQR
            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 focus:ring-emerald-500 ring-1 ring-emerald-200'
            : isFilled
            ? 'bg-white border-slate-400 text-slate-900 focus:ring-[#0B3B60] focus:border-[#0B3B60]'
            : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0B3B60] focus:border-[#0B3B60]'
        } ${error ? 'border-red-400 bg-red-50/50' : ''}`}
      />
    );
  };

  const filledCount = digits.filter(Boolean).length;
  const isAllFilled = filledCount === 12;

  return (
    <div className="space-y-1.5 w-full max-w-full overflow-hidden">
      {/* 3 Groups of 4 Digits - Guaranteed Single Row without Wrap */}
      <div className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 w-full flex-nowrap">
        {/* Group 1: 0, 1, 2, 3 */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-0.5 xs:gap-1 bg-slate-100/90 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200/90">
          {[0, 1, 2, 3].map(renderBox)}
        </div>

        {/* Separator dash */}
        <span className="text-slate-400 font-black text-xs sm:text-sm select-none shrink-0 px-0.5">-</span>

        {/* Group 2: 4, 5, 6, 7 */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-0.5 xs:gap-1 bg-slate-100/90 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200/90">
          {[4, 5, 6, 7].map(renderBox)}
        </div>

        {/* Separator dash */}
        <span className="text-slate-400 font-black text-xs sm:text-sm select-none shrink-0 px-0.5">-</span>

        {/* Group 3: 8, 9, 10, 11 (QR verified last 4 digits in Emerald) */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-0.5 xs:gap-1 bg-emerald-100/60 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-emerald-300 shadow-2xs">
          {[8, 9, 10, 11].map(renderBox)}
        </div>
      </div>

      {/* Helper / QR verification status */}
      <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 gap-1 overflow-hidden">
        {scannedLast4 ? (
          <span className="text-emerald-700 font-bold flex items-center gap-1 truncate text-[10px] sm:text-[11px]">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">अंतिम 4 अंक (<strong className="font-mono">{scannedLast4}</strong>) QR से भरे • पहले 8 अंक भरें</span>
          </span>
        ) : (
          <span className="truncate text-[10px] sm:text-[11px]">12 अंक दर्ज करें</span>
        )}

        <span className={`font-mono font-bold shrink-0 text-[10px] sm:text-[11px] ${isAllFilled ? 'text-emerald-700' : 'text-slate-600'}`}>
          {filledCount}/12 {isAllFilled && '✓'}
        </span>
      </div>
    </div>
  );
}
