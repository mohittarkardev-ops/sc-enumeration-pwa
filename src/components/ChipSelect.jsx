import React from 'react';

/**
 * Clean Government of India Utility Selector
 */
export default function ChipSelect({ label, options, value, onChange, required = false, columns = 2 }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-bold text-slate-900">
          {label} {required && <span className="text-red-600 font-bold">*</span>}
        </label>
      )}
      <div className={`grid grid-cols-${columns} gap-1.5`}>
        {options.map((opt) => {
          const isSelected = value === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => onChange(opt.code)}
              className={`px-2.5 py-1.5 text-left rounded text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-[#0B3B60] text-white border-[#072F5F] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {opt.label || opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
