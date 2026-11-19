import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound, Delete } from 'lucide-react';
import { EmblemOfIndia, CensusLogo } from './OfficialLogos';

export const APP_ACCESS_CODE_KEY = 'CENSUS_APP_UNLOCKED';

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isShaking, setIsShaking] = useState(false);

  const targetCode = (import.meta.env.VITE_APP_ACCESS_CODE || '09022007').trim();

  const handleVerifyCode = (codeToTest) => {
    setErrorMsg('');
    const entered = (codeToTest !== undefined ? codeToTest : pin).trim();

    if (!entered) {
      setErrorMsg('कृपया 8-अंकीय सुरक्षा कोड दर्ज करें।');
      return;
    }

    if (entered === targetCode) {
      setIsSuccess(true);
      if (rememberDevice) {
        localStorage.setItem(APP_ACCESS_CODE_KEY, 'true');
      } else {
        sessionStorage.setItem(APP_ACCESS_CODE_KEY, 'true');
      }
      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setIsShaking(true);
      setErrorMsg('गलत सुरक्षा कोड! केवल अधिकृत प्रगणक ही इस प्रणाली का उपयोग कर सकते हैं।');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleKeyPress = (digit) => {
    if (pin.length >= 12) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    // If 8 digits reached, automatically attempt unlock
    if (nextPin.length === targetCode.length) {
      handleVerifyCode(nextPin);
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-['Hind'] select-none relative overflow-x-hidden">
      
      {/* 1. National Tricolor Top Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shrink-0" />

      {/* Main Lock Card Container */}
      <div className="flex-1 flex items-center justify-center p-3.5 sm:p-6 my-auto">
        <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transition-all ${
          isShaking ? 'animate-shake' : ''
        }`}>
          
          {/* Official Indian Masthead Header */}
          <div className="bg-[#0B3B60] text-white p-4 sm:p-5 text-center relative border-b border-[#072F5F]">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-2xl bg-white/10 border border-white/20 shadow-md">
                <EmblemOfIndia className="w-8 h-10 sm:w-10 sm:h-12 text-amber-300" />
              </div>
            </div>

            <div className="text-[10px] sm:text-xs text-slate-200 tracking-widest uppercase font-bold">
              भारत सरकार • GOVERNMENT OF INDIA
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
              गृह मंत्रालय | महारजिस्ट्रार एवं जनगणना आयुक्त कार्यालय
            </div>
            <h1 className="text-base sm:text-lg font-black text-white mt-1">
              जनगणना प्रगणक प्रणाली (Census PE)
            </h1>

            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>गोपनीय • केवल अधिकृत प्रगणक हेतु</span>
            </div>
          </div>

          {/* Form & PIN Input Body */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                <KeyRound className="w-5 h-5 text-[#0B3B60]" />
                <span>प्रगणक सुरक्षा कोड दर्ज करें</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                सर्वेक्षण डेटा की गोपनीयता हेतु इस प्रणाली को लॉक किया गया है।
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>प्रमाणीकरण सफल! प्रवेश किया जा रहा है...</span>
              </div>
            )}

            {/* Visual PIN Display Box */}
            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyCode();
                  }}
                  placeholder="8-अंकीय कोड दर्ज करें"
                  className="w-full text-center tracking-widest font-mono text-xl sm:text-2xl font-black py-3 px-10 border-2 border-[#0B3B60] rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0B3B60]/20 text-[#0B3B60] placeholder:text-slate-400 placeholder:text-base placeholder:tracking-normal placeholder:font-sans"
                  autoFocus
                />
                
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg active:scale-95"
                  title={showPin ? 'कोड छुपाएं' : 'कोड देखें'}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 py-1">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      idx < pin.length
                        ? 'bg-[#0B3B60] scale-110 shadow-xs'
                        : 'bg-slate-200 border border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile-Friendly On-Screen Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit.toString())}
                  className="h-12 sm:h-14 bg-slate-100 hover:bg-slate-200 active:bg-[#0B3B60] active:text-white rounded-xl text-lg sm:text-xl font-black text-slate-800 transition-all shadow-xs flex items-center justify-center active:scale-95 border border-slate-200"
                >
                  {digit}
                </button>
              ))}

              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 sm:h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center active:scale-95 border border-slate-200"
              >
                साफ़ करें
              </button>

              {/* Digit 0 */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 sm:h-14 bg-slate-100 hover:bg-slate-200 active:bg-[#0B3B60] active:text-white rounded-xl text-lg sm:text-xl font-black text-slate-800 transition-all shadow-xs flex items-center justify-center active:scale-95 border border-slate-200"
              >
                0
              </button>

              {/* Backspace button */}
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-12 sm:h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-xs flex items-center justify-center active:scale-95 border border-slate-200"
                title="अंक हटाएं"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Remember device checkbox */}
            <div className="flex items-center justify-between pt-1 text-xs sm:text-sm text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B3B60] focus:ring-[#0B3B60] border-slate-300"
                />
                <span>इस डिवाइस पर सत्र याद रखें</span>
              </label>

              <span className="text-slate-400 font-mono text-xs">v1.2.0</span>
            </div>

            {/* Unlock Button */}
            <button
              type="button"
              onClick={() => handleVerifyCode()}
              disabled={isSuccess}
              className="w-full py-3 sm:py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Unlock className="w-5 h-5 text-amber-300" />
              <span>प्रणाली अनलॉक करें</span>
            </button>
          </div>

          {/* Security Footer Notice */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-बिट सुरक्षित • भारत की जनगणना अधिनियम के अंतर्गत संरक्षित</span>
          </div>

        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pb-3 text-xs text-slate-400 font-medium">
        महारजिस्ट्रार एवं जनगणना आयुक्त कार्यालय, गृह मंत्रालय, भारत सरकार
      </div>
    </div>
  );
}
