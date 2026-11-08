import React, { useState, useEffect } from 'react';
import { GrowthMarkIcon } from './BrandLogo';

export const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem('mfm_splash_shown');
    } catch {
      return true;
    }
  });

  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 400 : 1100;
    const fadeDuration = prefersReducedMotion ? 100 : 350;

    const timer = setTimeout(() => {
      setFading(true);
      const closeTimer = setTimeout(() => {
        setVisible(false);
        try {
          sessionStorage.setItem('mfm_splash_shown', 'true');
        } catch {
          // Ignore storage quota errors
        }
      }, fadeDuration);

      return () => clearTimeout(closeTimer);
    }, duration);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-350 ease-out select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,150,105,0.18)_0%,transparent_65%)] pointer-events-none" />

      {/* Centered Launch Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Growth Mark Logo with Emerald Glow */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
          <div className="relative transform transition-transform duration-700 ease-out scale-100">
            <GrowthMarkIcon size={72} className="drop-shadow-[0_8px_24px_rgba(16,185,129,0.35)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
          My Finance <span className="text-emerald-400">Manager</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs">
          Smart Personal & Office Expense Tracker
        </p>

        {/* Subtle loading bar */}
        <div className="w-36 h-1 bg-slate-800 rounded-full mt-7 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full origin-left animate-[shimmer_1s_infinite_linear]" />
        </div>

        <div className="text-[10px] text-slate-500 font-mono mt-3">
          BDT (৳) · Secure & Offline-Ready
        </div>
      </div>
    </div>
  );
};
