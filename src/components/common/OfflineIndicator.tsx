import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const { syncState, pendingSyncCount, processPendingOfflineQueue, syncError } = useFinance();
  const { language } = useLanguage();
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [prevSyncState, setPrevSyncState] = useState(syncState);

  const isBn = language === 'bn';

  // Show a temporary subtle confirmation when returning to online mode
  useEffect(() => {
    if (prevSyncState === 'offline' && syncState === 'online') {
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevSyncState(syncState);
  }, [syncState, prevSyncState]);

  // 1. Temporary "Back Online" Toast
  if (showOnlineToast) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span>{isBn ? 'পুনরায় সংযোগ স্থাপন হয়েছে (Online)' : 'Connected online'}</span>
      </div>
    );
  }

  // 2. Offline Mode Banner
  if (syncState === 'offline') {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-amber-400 leading-tight">
            {isBn ? 'অফলাইন মোড (Offline)' : 'Offline Mode'}
          </span>
          <span className="text-[10px] text-slate-300">
            {pendingSyncCount > 0
              ? isBn
                ? `${pendingSyncCount}টি রেকর্ড অফলাইনে সংরক্ষিত আছে`
                : `${pendingSyncCount} records pending sync`
              : isBn
              ? 'সকল তথ্য ডিভাইসে সুরক্ষিত রাখা হচ্ছে'
              : 'Data saved locally in IndexedDB'}
          </span>
        </div>
      </div>
    );
  }

  // 3. Syncing In Progress
  if (syncState === 'syncing') {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/95 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-md">
        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        <span className="text-[11px] font-semibold text-emerald-300">
          {isBn ? 'ক্লাউডের সাথে সিঙ্ক হচ্ছে...' : 'Syncing changes...'}
        </span>
      </div>
    );
  }

  // 4. Pending Sync Available (Online but has pending queue)
  if (syncState === 'pending' && pendingSyncCount > 0) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900/95 border border-teal-500/40 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md">
        <ArrowUpCircle className="w-4 h-4 text-teal-400 shrink-0" />
        <div className="flex flex-col">
          <span className="font-bold text-teal-300 leading-tight">
            {isBn ? `${pendingSyncCount}টি রেকর্ড অপেক্ষারত` : `${pendingSyncCount} Pending Sync`}
          </span>
          <span className="text-[10px] text-slate-400">
            {isBn ? 'অফলাইন লেনদেন ক্লাউডে পাঠানো হবে' : 'Pending offline queue'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => processPendingOfflineQueue()}
          className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition active:scale-95"
        >
          {isBn ? 'সিঙ্ক' : 'Sync'}
        </button>
      </div>
    );
  }

  // 5. Sync Encountered an Error
  if (syncState === 'failed') {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-rose-950/90 border border-rose-600/50 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <div className="flex flex-col">
          <span className="font-bold text-rose-300 leading-tight">
            {isBn ? 'সিঙ্কে সমস্যা হয়েছে' : 'Sync Paused'}
          </span>
          <span className="text-[10px] text-rose-200/80 truncate max-w-[180px]">
            {syncError || (isBn ? 'পরবর্তী সুযোগে আবার চেষ্টা করা হবে' : 'Will retry')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => processPendingOfflineQueue()}
          className="ml-2 px-2 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold transition"
        >
          {isBn ? 'পুনরায়' : 'Retry'}
        </button>
      </div>
    );
  }

  return null;
};
