import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, ShieldCheck, X } from 'lucide-react';
import { GrowthMarkIcon } from './BrandLogo';
import { useLanguage } from '../../context/LanguageContext';
import { useFinance } from '../../context/FinanceContext';

export const PWAUpdatePrompt: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        // Periodically check for service worker updates every 60 minutes
        setInterval(() => {
          r.update().catch((err) => console.debug('SW background check:', err));
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  const { syncing } = useFinance();

  if (!needRefresh) return null;

  const handleUpdate = () => {
    if (syncing) {
      alert(
        isBn
          ? 'একটি লেনদেন বর্তমানে সেভ হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার আপডেট করুন।'
          : 'A transaction is currently being saved. Please wait a moment before updating.'
      );
      return;
    }
    // Activate waiting Service Worker cleanly
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <div
      role="region"
      aria-label="Application Update Notification"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[60] max-w-sm w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ring-1 ring-emerald-500/20"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <GrowthMarkIcon size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{isBn ? 'নতুন সংস্করণ পাওয়া গেছে' : 'Update Available'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg transition"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            {isBn
              ? 'মাই ফাইন্যান্স ম্যানেজারের নতুন আপডেট প্রস্তুত। আপনার অফলাইন রেকর্ড এবং ডাটা সম্পূর্ণ নিরাপদ থাকবে।'
              : 'A new version of My Finance Manager is ready. Your offline records, accounts, and settings are safely preserved.'}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{isBn ? 'ডাটা সুরক্ষিত ও অপরিবর্তিত থাকবে' : 'Data-safe update · No data loss'}</span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleUpdate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isBn ? 'এখনই আপডেট করুন' : 'Update Now'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              {isBn ? 'পরে' : 'Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
