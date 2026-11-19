import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Settings, 
  Download, 
  PlusCircle, 
  ListFilter,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { db } from '../db/db';
import { syncPendingData } from '../db/supabase';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { EmblemOfIndia, CensusLogo } from './OfficialLogos';

export default function Header({
  activeSection,
  onSectionChange,
  activeView,
  onViewChange,
  onOpenSettings,
  villageName = 'मथुरा',
  sections = [
    { id: '1', name: 'सेक्शन 1' },
    { id: '2', name: 'सेक्शन 2' },
    { id: '3', name: 'सेक्शन 3' }
  ]
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updatePendingCount = async () => {
      const pendingHh = await db.households.where('sync_status').equals('pending').count();
      const pendingMem = await db.members.where('sync_status').equals('pending').count();
      setPendingCount(pendingHh + pendingMem);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMsg('क्लाउड डेटाबेस से समन्वयित हो रहा है...');
    const res = await syncPendingData();
    setIsSyncing(false);
    setSyncMsg(res.message);
    setTimeout(() => setSyncMsg(''), 4500);
  };

  return (
    <header className="sticky top-0 z-30 shadow-md font-['Hind']">
      {/* 1. Official National Tricolor Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      {/* 2. Official GoI Masthead */}
      <div className="bg-[#0B3B60] text-white px-3.5 py-2.5 border-b border-[#072F5F]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          
          {/* Left: State Emblem + Official Department Branding */}
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-white/10 border border-white/15 shrink-0 shadow-sm">
              <EmblemOfIndia className="w-7 h-9 text-amber-300" />
            </div>

            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-200 tracking-wider uppercase font-semibold leading-none">
                भारत सरकार • Government of India
              </div>
              <div className="text-[9px] text-slate-300 leading-tight">
                गृह मंत्रालय | महारजिस्ट्रार एवं जनगणना आयुक्त कार्यालय
              </div>
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                जनगणना प्रगणक प्रणाली (Census PE Schedule)
              </h1>
            </div>
          </div>

          {/* Right: Circular Logo + Tools */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block shrink-0">
              <CensusLogo className="w-9 h-9" />
            </div>

            {/* Excel Download */}
            <button
              onClick={exportAllDataToExcel}
              title="डेटा Excel में एक्सपोर्ट करें"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#134D7E] hover:bg-[#1A5B94] border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="प्रशासनिक विन्यास एवं सेटिंग्स"
              className="p-2 rounded-xl bg-[#134D7E] hover:bg-[#1A5B94] border border-white/20 text-white transition-all active:scale-95 shadow-sm"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* View Mode Switcher */}
            <button
              onClick={() => onViewChange(activeView === 'form' ? 'list' : 'form')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              {activeView === 'form' ? (
                <>
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>पंजीका</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>नया प्रपत्र</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC CUSTOMIZABLE SECTIONS RIBBON */}
      <div className="bg-[#072F5F] px-3.5 py-1.5 text-xs text-white border-b border-[#052246]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          
          {/* Scrollable Dynamic Section Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide shrink-0">
              प्रभाग:
            </span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => onSectionChange(sec.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border whitespace-nowrap shadow-sm active:scale-95 ${
                  activeSection === sec.id
                    ? 'bg-white text-[#0B3B60] border-white font-extrabold'
                    : 'bg-[#0B3B60]/80 text-slate-200 border-white/10 hover:bg-[#0B3B60]'
                }`}
              >
                {sec.name}
              </button>
            ))}

            <button
              onClick={onOpenSettings}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 shrink-0 transition-all"
              title="सेक्शन / टोले का नाम बदलें या नया जोड़ें"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium hidden sm:inline-flex">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ऑनलाइन
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-amber-300 font-medium hidden sm:inline-flex">
                <WifiOff className="w-3 h-3 text-amber-300" />
                ऑफ़लाइन
              </span>
            )}

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                pendingCount > 0
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm animate-pulse'
                  : 'bg-[#134D7E] text-slate-200 border-white/10 hover:bg-[#1A5B94]'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'समन्वय...' : pendingCount > 0 ? `${pendingCount} लंबित` : 'समन्वित'}
            </button>
          </div>

        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMsg && (
        <div className="bg-amber-100 border-b border-amber-300 text-slate-900 px-3.5 py-1 text-center text-xs font-bold">
          {syncMsg}
        </div>
      )}
    </header>
  );
}
