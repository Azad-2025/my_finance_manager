import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X, Share2, PlusSquare, MoreVertical, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card' | 'button';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  const isBn = language === 'bn';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // If already installed
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className={`p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isBn ? 'মোবাইলে ইনস্টল করা আছে' : 'Installed on this Device'}
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {isBn ? 'স্ট্যান্ডঅ্যালোন PWA মোডে চলছে' : 'Running in standalone native PWA mode'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
            Active
          </span>
        </div>
      );
    }
    return null;
  }

  // Card Variant (For Mobile Drawer or Settings)
  if (variant === 'card') {
    return (
      <>
        <div
          onClick={handleInstallClick}
          className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md hover:shadow-lg cursor-pointer transition transform active:scale-[0.99] flex items-center justify-between group ${className}`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Smartphone className="w-6 h-6 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-extrabold tracking-tight">
                  {isBn ? 'ফোনে ইনস্টল করুন (Install App)' : 'Install App on Phone'}
                </h4>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                {isBn
                  ? 'এক ক্লিকে ফুল-স্ক্রিন হোমস্ক্রিন অ্যাপ হিসেবে ব্যবহার করুন'
                  : 'Fast, offline-ready & full-screen native mobile experience'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 text-xs font-extrabold shadow-sm group-hover:bg-emerald-50 transition shrink-0 ml-2"
          >
            {isBn ? 'ইনস্টল' : 'Install'}
          </button>
        </div>

        {/* Installation Modal */}
        {showGuideModal && renderGuideModal()}
      </>
    );
  }

  // Full Button Variant
  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition whitespace-nowrap ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>{isBn ? 'মোবাইলে ইনস্টল করুন' : 'Install App'}</span>
        </button>

        {showGuideModal && renderGuideModal()}
      </>
    );
  }

  // Default: Compact Navbar Button
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-1.5 text-xs font-bold shadow-xs transition whitespace-nowrap shrink-0 active:scale-95 ${className}`}
        title={isBn ? 'ফোনে অ্যাপ ইনস্টল করুন' : 'Install app on phone'}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isBn ? 'ইনস্টল' : 'Install'}</span>
      </button>

      {showGuideModal && renderGuideModal()}
    </>
  );

  function renderGuideModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'ফোনে অ্যাপ ইনস্টল করার নিয়ম' : 'How to Install on Phone'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'হোম স্ক্রিন থেকে সরাসরি অ্যাপের মতো ব্যবহার করুন' : 'Add to Home Screen for native app experience'}
              </p>
            </div>
          </div>

          {/* OS Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGuideTab('android')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                guideTab === 'android'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Android (Chrome)
            </button>
            <button
              type="button"
              onClick={() => setGuideTab('ios')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                guideTab === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              iPhone / iPad (Safari)
            </button>
          </div>

          {/* Android Steps */}
          {guideTab === 'android' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {isInstallable && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 mb-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await install();
                      setShowGuideModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isBn ? 'সরাসরি ইনস্টল করুন (Direct Install)' : 'Tap to Install Directly'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  1
                </span>
                <p>
                  {isBn ? (
                    <>Chrome ব্রাউজারের উপরে ডান পাশের <strong className="text-slate-900 dark:text-white">৩টি ডট (⋮) মেনু</strong> আইকনে চাপ দিন।</>
                  ) : (
                    <>Tap the <strong className="text-slate-900 dark:text-white">three dots (⋮)</strong> menu in the top-right corner of Chrome.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  2
                </span>
                <p>
                  {isBn ? (
                    <>মেনু থেকে <strong className="text-slate-900 dark:text-white">"Install app"</strong> অথবা <strong className="text-slate-900 dark:text-white">"Add to Home screen"</strong> সিলেক্ট করুন।</>
                  ) : (
                    <>Select <strong className="text-slate-900 dark:text-white">"Install app"</strong> or <strong className="text-slate-900 dark:text-white">"Add to Home screen"</strong> from the menu.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  3
                </span>
                <p>
                  {isBn ? (
                    <>কনফার্মেশনে <strong className="text-slate-900 dark:text-white">"Install"</strong> বাটনে চাপ দিন। আপনার ফোনের হোমস্ক্রিনে অ্যাপ আইকন চলে আসবে!</>
                  ) : (
                    <>Tap <strong className="text-slate-900 dark:text-white">"Install"</strong> to confirm. The app icon will appear on your phone's home screen!</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* iOS Steps */}
          {guideTab === 'ios' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  1
                </span>
                <p>
                  {isBn ? (
                    <>Safari ব্রাউজারের নিচে থাকা <strong className="text-slate-900 dark:text-white">Share (শেয়ার 📤)</strong> বাটনে ট্যাপ করুন।</>
                  ) : (
                    <>Tap the <strong className="text-slate-900 dark:text-white">Share icon (📤)</strong> at the bottom of Safari.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  2
                </span>
                <p>
                  {isBn ? (
                    <>নিচের দিকে স্ক্রোল করে <strong className="text-slate-900 dark:text-white">"Add to Home Screen (➕)"</strong> অপশনে চাপ দিন।</>
                  ) : (
                    <>Scroll down and tap <strong className="text-slate-900 dark:text-white">"Add to Home Screen (➕)"</strong>.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  3
                </span>
                <p>
                  {isBn ? (
                    <>উপরে ডানপাশে <strong className="text-slate-900 dark:text-white">"Add"</strong> চাপ দিন। ফুল-স্ক্রিন অ্যাপ হিসেবে মোবাইল থেকে ব্যবহার করুন!</>
                  ) : (
                    <>Tap <strong className="text-slate-900 dark:text-white">"Add"</strong> in top right. You can now launch it directly from your home screen!</>
                  )}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {isBn ? 'বুঝেছি (Got It)' : 'Got It'}
          </button>
        </div>
      </div>
    );
  }
};
