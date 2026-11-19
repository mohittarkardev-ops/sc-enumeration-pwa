import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Settings, 
  Download, 
  PlusCircle, 
  ListFilter,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { db } from '../db/db';
import { syncPendingData } from '../db/supabase';
import { exportAllDataToExcel } from '../utils/exportExcel';

export default function Header({
  activeSection,
  onSectionChange,
  activeView,
  onViewChange,
  onOpenSettings,
  villageName = 'मथुरा'
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
    setSyncMsg('क्लाउड डेटाबेस से सिंक हो रहा है...');
    const res = await syncPendingData();
    setIsSyncing(false);
    setSyncMsg(res.message);
    setTimeout(() => setSyncMsg(''), 4500);
  };

  return (
    <header className="sticky top-0 z-30 shadow-md font-['Hind']">
      {/* 1. Official Tricolor Top Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      {/* 2. Official National Census Masthead */}
      <div className="bg-[#0B3B60] text-white px-3.5 py-2.5 border-b border-[#072F5F]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          
          {/* Government Branding & Title */}
          <div className="flex items-center gap-2.5">
            {/* Emblem/Shield Emblem */}
            <div className="w-8 h-8 rounded border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>

            <div>
              <div className="text-[10px] text-slate-200 tracking-wider uppercase font-semibold leading-none">
                भारत सरकार | Government of India
              </div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight mt-0.5">
                जनगणना प्रगणक प्रणाली (Census Portal)
              </h1>
              <div className="text-[10px] text-amber-300 font-medium leading-none">
                परिवार प्रपत्र (Household Schedule) • जिला: मथुरा
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* Excel Download */}
            <button
              onClick={exportAllDataToExcel}
              title="डेटा Excel में एक्सपोर्ट करें"
              className="px-2 py-1 rounded bg-[#134D7E] hover:bg-[#1A5B94] border border-white/15 text-white text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="प्रगणक एवं लोकेशन सेटिंग्स"
              className="p-1.5 rounded bg-[#134D7E] hover:bg-[#1A5B94] border border-white/15 text-white transition-all active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* List / Form View Toggle */}
            <button
              onClick={() => onViewChange(activeView === 'form' ? 'list' : 'form')}
              className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
            >
              {activeView === 'form' ? (
                <>
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>पंजीकृत सूची</span>
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

      {/* 3. Administrative Control Bar (Sections + Sync Status) */}
      <div className="bg-[#072F5F] px-3.5 py-1.5 text-xs text-white border-b border-[#052246]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide mr-0.5">
              ग्राम भाग:
            </span>
            {['1', '2', '3'].map((sec) => (
              <button
                key={sec}
                onClick={() => onSectionChange(sec)}
                className={`px-3 py-0.5 rounded text-xs font-bold transition-all border ${
                  activeSection === sec
                    ? 'bg-white text-[#0B3B60] border-white shadow-sm'
                    : 'bg-[#0B3B60]/70 text-slate-200 border-white/10 hover:bg-[#0B3B60]'
                }`}
              >
                सेक्शन {sec}
              </button>
            ))}
          </div>

          {/* Sync Engine Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                नेटवर्क सक्रिय
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                <WifiOff className="w-3 h-3 text-amber-300" />
                ऑफ़लाइन कार्यप्रणाली
              </span>
            )}

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border transition-all ${
                pendingCount > 0
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                  : 'bg-[#134D7E] text-slate-200 border-white/10 hover:bg-[#1A5B94]'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'सिंक...' : pendingCount > 0 ? `${pendingCount} लंबित सिंक` : 'सिंक पूर्ण'}
            </button>
          </div>

        </div>
      </div>

      {/* Sync Status Alert Strip */}
      {syncMsg && (
        <div className="bg-amber-100 border-b border-amber-300 text-slate-900 px-3.5 py-1 text-center text-xs font-bold">
          {syncMsg}
        </div>
      )}
    </header>
  );
}
