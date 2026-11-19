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
  Edit2,
  Database,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Lock,
  BookOpen
} from 'lucide-react';
import { db } from '../db/db';
import { syncPendingData, checkDatabaseConnection } from '../db/supabase';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { EmblemOfIndia, CensusLogo } from './OfficialLogos';

export default function Header({
  activeSection,
  onSectionChange,
  activeView,
  onViewChange,
  onOpenSettings,
  onLockApp,
  onOpenPanjika,
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
  
  // Real Database Connection Check State
  const [dbStatus, setDbStatus] = useState({
    checked: false,
    checking: false,
    connected: false,
    code: 'CHECKING',
    statusText: 'जांच जारी...',
    message: '',
    latency: 0
  });

  // Verify real database connection
  const runLiveDbCheck = async () => {
    setDbStatus(prev => ({ ...prev, checking: true }));
    const result = await checkDatabaseConnection();
    setDbStatus({
      checked: true,
      checking: false,
      connected: result.connected,
      code: result.code,
      statusText: result.statusText,
      message: result.message,
      latency: result.latency
    });
    return result;
  };

  useEffect(() => {
    // Initial real DB check
    runLiveDbCheck();

    const handleOnline = () => {
      setIsOnline(true);
      runLiveDbCheck();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDbStatus({
        checked: true,
        checking: false,
        connected: false,
        code: 'OFFLINE',
        statusText: 'ऑफ़लाइन',
        message: 'डिवाइस ऑफ़लाइन है',
        latency: 0
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending sync count gently (every 6 seconds to prevent mobile CPU lag)
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const pendingHh = await db.households.where('sync_status').equals('pending').count();
        const pendingMem = await db.members.where('sync_status').equals('pending').count();
        setPendingCount(pendingHh + pendingMem);
      } catch (err) {
        console.warn('Pending count error:', err);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMsg('क्लाउड डेटाबेस से लाइव समन्वयित हो रहा है...');
    
    // First run real check
    const check = await runLiveDbCheck();
    if (!check.connected && check.code !== 'CONNECTED') {
      setIsSyncing(false);
      setSyncMsg(check.message);
      setTimeout(() => setSyncMsg(''), 6000);
      return;
    }

    const res = await syncPendingData();
    setIsSyncing(false);
    setSyncMsg(res.message);
    if (res.updatedSettings && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('census_settings_updated', { detail: res.updatedSettings }));
    }
    setTimeout(() => setSyncMsg(''), 5000);
  };

  const handleStatusBadgeClick = () => {
    if (dbStatus.message) {
      setSyncMsg(dbStatus.message);
      setTimeout(() => setSyncMsg(''), 6000);
    } else {
      runLiveDbCheck();
    }
  };

  return (
    <header className="sticky top-0 z-30 shadow-md">
      {/* 1. Official National Tricolor Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      {/* 2. Official GoI Masthead - Enhanced Mobile Typography */}
      <div className="bg-[#0B3B60] text-white px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#072F5F]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left: State Emblem + Official Department Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1 rounded-xl bg-white/10 border border-white/20 shrink-0 shadow-xs flex items-center justify-center ring-1 ring-white/10">
              <EmblemOfIndia className="w-6 h-8 sm:w-7 sm:h-9 text-amber-300" />
            </div>

            <div className="space-y-0.5">
              <div className="text-[10px] sm:text-xs text-sky-200 tracking-wider uppercase font-semibold leading-none">
                भारत सरकार • <span className="font-english font-bold">Government of India</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 leading-tight line-clamp-1">
                गृह मंत्रालय | महारजिस्ट्रार एवं जनगणना आयुक्त कार्यालय
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight flex items-center gap-1.5">
                <span>जनगणना प्रगणक प्रणाली</span>
                <span className="font-english text-xs sm:text-sm font-bold text-amber-300 bg-white/10 px-1.5 py-0.2 rounded border border-white/15">PE</span>
              </h1>
            </div>
          </div>

          {/* Right: Tools & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:block shrink-0">
              <CensusLogo className="w-8 h-8" />
            </div>

            {/* Excel Download */}
            <button
              onClick={exportAllDataToExcel}
              title="डेटा Excel में एक्सपोर्ट करें"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs min-h-[38px]"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline font-english">Excel</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="प्रशासनिक विन्यास एवं सेटिंग्स"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all active:scale-95 shadow-xs min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lock Application */}
            {onLockApp && (
              <button
                onClick={onLockApp}
                title="प्रणाली तुरंत लॉक करें (Lock App)"
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-900/80 border border-white/20 text-white transition-all active:scale-95 shadow-xs min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <Lock className="w-4 h-4 text-amber-300" />
              </button>
            )}

            {/* View Mode Switcher */}
            <button
              onClick={() => onViewChange(activeView === 'form' ? 'list' : 'form')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-900 text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-xs min-h-[38px]"
            >
              {activeView === 'form' ? (
                <>
                  <ListFilter className="w-4 h-4" />
                  <span>परिवार सूची</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>नया प्रपत्र</span>
                </>
              )}
            </button>

            {/* Dedicated Register Book View Button (Slug: /panjika) */}
            <button
              onClick={onOpenPanjika}
              title="आधिकारिक परिवार पंजिका प्रपत्र (/panjika)"
              className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs min-h-[38px] bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>पंजिका</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC SECTIONS RIBBON & REAL DATABASE STATUS */}
      <div className="bg-[#072F5F] px-3 sm:px-4 py-2 text-white border-b border-[#052246]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          
          {/* Scrollable Dynamic Section Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[62%] sm:max-w-[70%]">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide shrink-0">
              प्रभाग:
            </span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => onSectionChange(sec.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all border whitespace-nowrap shadow-sm active:scale-95 ${
                  activeSection === sec.id
                    ? 'bg-white text-[#0B3B60] border-white font-black'
                    : 'bg-[#0B3B60]/80 text-slate-200 border-white/10 hover:bg-[#0B3B60]'
                }`}
              >
                {sec.name}
              </button>
            ))}

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 shrink-0 transition-all active:scale-95"
              title="सेक्शन / टोले का नाम बदलें या नया जोड़ें"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* REAL DATABASE CONNECTION BADGE (Not fake!) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleStatusBadgeClick}
              title={dbStatus.message || 'लाइव कनेक्शन स्थिति देखें'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                dbStatus.connected
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : dbStatus.code === 'SCHEMA_MISSING'
                  ? 'bg-amber-950/90 border-amber-500/60 text-amber-300'
                  : dbStatus.code === 'AUTH_ERROR'
                  ? 'bg-rose-950/90 border-rose-500/60 text-rose-300'
                  : 'bg-slate-800/90 border-slate-600/60 text-slate-300'
              }`}
            >
              {dbStatus.checking ? (
                <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
              ) : dbStatus.connected ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              ) : dbStatus.code === 'SCHEMA_MISSING' ? (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              ) : (
                <Database className="w-3 h-3 text-slate-400" />
              )}
              
              <span className="hidden xs:inline">
                {dbStatus.connected
                  ? `DB लाइव (${dbStatus.latency}ms)`
                  : dbStatus.code === 'SCHEMA_MISSING'
                  ? 'स्कीमा शेष'
                  : dbStatus.code === 'AUTH_ERROR'
                  ? 'API Key एरर'
                  : 'लोकल मोड'}
              </span>
            </button>

            {/* Sync Trigger Button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all active:scale-95 ${
                pendingCount > 0
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                  : 'bg-[#134D7E] text-slate-200 border-white/10 hover:bg-[#1A5B94]'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'सिंक...' : pendingCount > 0 ? `${pendingCount} लंबित` : 'समन्वित'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Sync / Alert Message Banner */}
      {syncMsg && (
        <div className="bg-amber-100 border-b border-amber-300 text-slate-900 px-3.5 py-1.5 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 animate-fade-in">
          <span>{syncMsg}</span>
          <button 
            onClick={() => setSyncMsg('')} 
            className="text-slate-500 hover:text-black ml-2 font-mono"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
}
