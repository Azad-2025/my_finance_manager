import React from 'react';
import { Sun, Moon, User as UserIcon, RefreshCw } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';

interface NavbarProps {
  currentViewTitle: string;
  onOpenAuth: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentViewTitle,
  onOpenAuth,
  darkMode,
  onToggleDarkMode,
}) => {
  const { userProfile } = useAuth();
  const { syncing } = useFinance();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Transparent SVG Brand Logo & Section Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Seamless transparent SVG Brand Logo without any white box, card, or border */}
        <BrandLogo size="md" />

        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">
            {currentViewTitle}
          </span>
        </div>
      </div>

      {/* Zone 2: Sync status, Language Switcher, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {syncing && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden md:inline font-medium">{t('syncing')}</span>
          </div>
        )}

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Compact Language Switcher (replaces the header Add button) */}
        <LanguageSwitcher />

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={darkMode ? t('switchToLight') : t('switchToDark')}
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          title={`Profile: ${userProfile.name} (${userProfile.phone})`}
        >
          <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline max-w-[150px] truncate">
            {userProfile.name}
          </span>
        </button>
      </div>
    </header>
  );
};
