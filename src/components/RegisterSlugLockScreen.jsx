import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';
import { EmblemOfIndia, CensusLogo } from './OfficialLogos';

export default function RegisterSlugLockScreen({ expectedSlug = 'panjika-mathura', onSuccess, onSwitchToMasterPin }) {
  const [inputSlug, setInputSlug] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const entered = inputSlug.trim().toLowerCase();
    const target = (expectedSlug || 'panjika-mathura').trim().toLowerCase();

    if (!entered) {
      setErrorMsg('कृपया पंजिका सुरक्षा स्लग (Token) दर्ज करें।');
      return;
    }

    if (entered === target) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('PANJIKA_SLUG_UNLOCKED', 'true');
      }
      onSuccess();
    } else {
      setIsShaking(true);
      setErrorMsg('अमान्य सुरक्षा स्लग (Invalid Slug)! कृपया सही अधिकृत टोकन दर्ज करें।');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* 1. National Tricolor Top Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shrink-0" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-3.5 sm:p-6 my-auto">
        <div
          className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transition-all ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Header */}
          <div className="bg-[#0B3B60] text-white p-4 sm:p-5 text-center relative border-b border-[#072F5F]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38]" />

            <div className="flex justify-center items-center gap-3 mb-2.5 pt-1">
              <div className="p-1.5 rounded-2xl bg-white/10 border border-white/20 shadow-md">
                <EmblemOfIndia className="h-10 sm:h-12 w-auto" />
              </div>
              <div className="p-1 rounded-2xl bg-white/10 border border-white/20 shadow-md">
                <CensusLogo className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
              </div>
            </div>

            <div className="text-[10px] sm:text-xs text-sky-200 tracking-widest uppercase font-semibold">
              भारत सरकार • GOVERNMENT OF INDIA
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium mt-0.5">
              गृह मंत्रालय • महारजिस्ट्रार एवं जनगणना आयुक्त कार्यालय
            </div>
            <h1 className="text-base sm:text-lg font-serifHindi font-bold text-white mt-1.5 tracking-tight flex items-center justify-center gap-1.5">
              <BookOpen className="w-5 h-5 text-amber-300" />
              <span>परिवार पंजिका (Census Register Book)</span>
            </h1>
            <div className="mt-1">
              <span className="text-[11px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                सुरक्षित पठन मोड (Read-Only Access)
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                पंजिका देखने हेतु सुरक्षा स्लग दर्ज करें
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                प्रगणक द्वारा जारी अधिकृत सुरक्षा कोड (Slug / Token) नीचे प्रविष्ट करें:
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सुरक्षा स्लग (Security Slug / Token)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={inputSlug}
                    onChange={(e) => {
                      setInputSlug(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="उदा. panjika-mathura"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3B60] focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#0B3B60] hover:bg-[#072F5F] active:scale-98 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>पंजिका खोलें (Open Register)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Read-Only Guarantee Notice */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>केवल पठन अधिकार (Strictly Read-Only)</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-amber-800">
                इस मोड में केवल परिवार प्रपत्र देखे व प्रिंट किए जा सकते हैं। कोई भी सदस्य या परिवार एडिट अथवा डिलीट नहीं किया जा सकता।
              </p>
            </div>

            {/* Switch to Master PIN Login */}
            {onSwitchToMasterPin && (
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={onSwitchToMasterPin}
                  className="text-xs text-slate-600 hover:text-[#0B3B60] font-bold inline-flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#0B3B60]" />
                  <span>क्या आप मुख्य प्रगणक हैं? मास्टर पिन से लॉगिन करें</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-400">
        राष्ट्रीय सूचना विज्ञान केंद्र (NIC) • जनगणना डिजिटल अनुभाग
      </footer>
    </div>
  );
}
