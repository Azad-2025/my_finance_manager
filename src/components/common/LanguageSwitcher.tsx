import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Language } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen]);

  const languages: { code: Language; label: string; short: string; flag: string }[] = [
    { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
    { code: 'bn', label: 'বাংলা (Bangla)', short: 'বাং', flag: '🇧🇩' },
  ];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Compact Header Switcher Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-2xs group"
        title="Change Language / ভাষা পরিবর্তন করুন"
        aria-label="Change Language"
        aria-expanded={dropdownOpen}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="font-mono text-[11px] font-bold">
          {language === 'en' ? 'EN' : 'বাং'}
        </span>
      </button>

      {/* Language Options Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            Language / ভাষা
          </div>

          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
