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
import { EmblemOfIndia, CensusLogo, AadhaarLogo } from './OfficialLogos';

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
    <header className="relative w-full max-w-full overflow-hidden bg-[#0B3B60] shadow-xs print:hidden">
      {/* 1. Official National Tricolor Accent Bar (myAadhaar tricolor wash) */}
      <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38]" />

      {/* 2. Official GoI Masthead - Dignified Official Aesthetics */}
      <div className="bg-[#0B3B60] text-white px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-[#072F5F]/80 w-full overflow-hidden">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 w-full">
          
          {/* Left: Real State Emblem of India + Official Department Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="p-1 rounded-xl bg-white/10 border border-white/20 shrink-0 shadow-xs flex items-center justify-center ring-1 ring-white/15">
              <EmblemOfIndia className="h-8 sm:h-10 w-auto" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-[9.5px] sm:text-xs text-sky-200 tracking-wider uppercase font-semibold leading-none truncate">
                भारत सरकार • <span className="font-english font-bold">GOVERNMENT OF INDIA</span>
              </div>
              <div className="text-[8.5px] sm:text-[10.5px] text-slate-300 leading-tight hidden xs:block truncate">
                गृह मंत्रालय • महारजिस्ट्रार एवं जनगणना आयुक्त कार्यालय
              </div>
              <h1 className="text-sm xs:text-base sm:text-lg font-serifHindi font-bold tracking-tight text-white leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">जनगणना प्रगणक प्रणाली</span>
                <span className="font-sans text-[9px] sm:text-[10px] font-extrabold text-amber-300 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/15 shrink-0">
                  PE
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Census Emblem & Modern Pill Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Real Official Census Emblem */}
            <div className="hidden sm:flex items-center mr-1">
              <CensusLogo className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white/30 shadow-xs" />
            </div>

            {/* Excel Download */}
            <button
              onClick={exportAllDataToExcel}
              title="डेटा Excel में एक्सपोर्ट करें"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-xs min-h-[34px] sm:min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden md:inline font-english">Excel</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="प्रशासनिक विन्यास एवं सेटिंग्स"
              className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 shadow-xs min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Lock Application */}
            {onLockApp && (
              <button
                onClick={onLockApp}
                title="प्रणाली तुरंत लॉक करें (Lock App)"
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-rose-900/80 border border-white/20 text-amber-300 transition-all active:scale-95 shadow-xs min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              </button>
            )}

            {/* View Mode Switcher */}
            <button
              onClick={() => onViewChange(activeView === 'form' ? 'list' : 'form')}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs min-h-[34px] sm:min-h-[36px] shrink-0"
            >
              {activeView === 'form' ? (
                <>
                  <ListFilter className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">सूची</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">नया</span>
                </>
              )}
            </button>

            {/* Dedicated Register Book View Button (Slug: /panjika) */}
            <button
              onClick={onOpenPanjika}
              title="आधिकारिक परिवार पंजिका प्रपत्र (/panjika)"
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs min-h-[34px] sm:min-h-[36px] bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>पंजिका</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC SECTIONS RIBBON & REAL DATABASE STATUS */}
      <div className="bg-[#072F5F] px-2.5 sm:px-4 py-1.5 sm:py-2 text-white border-b border-[#052246] w-full overflow-hidden">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 w-full">
          
          {/* Scrollable Dynamic Section Tabs */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wide shrink-0">
              प्रभाग:
            </span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => onSectionChange(sec.id)}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap shadow-xs active:scale-95 ${
                  activeSection === sec.id
                    ? 'bg-white text-[#0B3B60] border-white font-bold shadow-sm'
                    : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                }`}
              >
                {sec.name}
              </button>
            ))}

            <button
              onClick={onOpenSettings}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-amber-300 shrink-0 transition-all active:scale-95"
              title="सेक्शन / टोले का नाम बदलें या नया जोड़ें"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>

          {/* REAL DATABASE CONNECTION BADGE (Not fake!) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={handleStatusBadgeClick}
              title={dbStatus.message || 'लाइव कनेक्शन स्थिति देखें'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border transition-all active:scale-95 ${
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
              
              <span>
                {dbStatus.connected ? (
                  <>
                    <span className="hidden sm:inline">DB </span>
                    <span className="font-mono">{dbStatus.latency}ms</span>
                  </>
                ) : dbStatus.code === 'SCHEMA_MISSING' ? (
                  'स्कीमा शेष'
                ) : dbStatus.code === 'AUTH_ERROR' ? (
                  'Key एरर'
                ) : (
                  'लोकल'
                )}
              </span>
            </button>

            {/* Sync Trigger Button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border transition-all active:scale-95 ${
                pendingCount > 0
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
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
