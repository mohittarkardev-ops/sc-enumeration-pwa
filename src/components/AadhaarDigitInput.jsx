import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * AadhaarDigitInput
 * - 12-digit segmented input in 3 groups of 4 boxes ([ ][ ][ ][ ]  [ ][ ][ ][ ]  [ ][ ][ ][ ])
 * - Pre-populates and visually highlights the last 4 digits from Aadhaar QR code scan
 * - Allows enumerator to verify last 4 digits and only type the first 8 digits
 * - Auto-advances focus on digit entry
 * - Auto-backspaces across boxes
 * - Handles paste (splits across boxes, ignores non-digits)
 * - inputMode="numeric" for mobile numeric keyboard
 * - Smart 'नहीं' state display with 1-click restore
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
      // Send string with digits or partial
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
      <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-300 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-700">
            आधार उपलब्ध नहीं है (प्रपत्र में <strong className="text-slate-900">'नहीं'</strong> दर्ज होगा)
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-[#0B3B60] shadow-xs active:scale-95 transition-all"
        >
          + 12 अंक दर्ज करें
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
        className={`w-7 h-9 xs:w-8 xs:h-10 sm:w-9 sm:h-11 text-center font-mono text-sm sm:text-base font-black rounded-lg border transition-all focus:outline-none focus:ring-2 select-all ${
          isFromQR
            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 focus:ring-emerald-500 font-black ring-1 ring-emerald-200'
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
    <div className="space-y-2">
      {/* 3 Groups of 4 Digits */}
      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 flex-wrap">
        {/* Group 1: 0, 1, 2, 3 */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[0, 1, 2, 3].map(renderBox)}
        </div>

        {/* Separator dash */}
        <span className="text-slate-400 font-bold hidden sm:inline">-</span>

        {/* Group 2: 4, 5, 6, 7 */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[4, 5, 6, 7].map(renderBox)}
        </div>

        {/* Separator dash */}
        <span className="text-slate-400 font-bold hidden sm:inline">-</span>

        {/* Group 3: 8, 9, 10, 11 (QR verified last 4 digits) */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-emerald-100/70 p-1 rounded-xl border border-emerald-300 shadow-xs">
          {[8, 9, 10, 11].map(renderBox)}
        </div>
      </div>

      {/* Helper / QR verification status */}
      <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 flex-wrap gap-1">
        {scannedLast4 ? (
          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>अंतिम 4 अंक (<strong className="font-mono">{scannedLast4}</strong>) QR से भरे गए • पहले 8 अंक कार्ड से भरें</span>
          </span>
        ) : (
          <span>संख्यात्मक कीपैड से 12 अंक क्रमानुसार दर्ज करें</span>
        )}

        <span className={`font-mono font-bold ${isAllFilled ? 'text-emerald-700' : 'text-slate-600'}`}>
          {filledCount}/12 अंक {isAllFilled && '✓'}
        </span>
      </div>
    </div>
  );
}
