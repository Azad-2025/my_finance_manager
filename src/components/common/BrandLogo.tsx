import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Transparent SVG Brand Logo for My Finance Manager
 * Features the signature Growth Mark (stylized 'M' with ascending trend arrow)
 * Blends naturally into light/dark headers without any card, border, or white background.
 */
export const GrowthMarkIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-7 h-7',
  size = 28,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Defs for rich emerald gradient */}
    <defs>
      <linearGradient id="growthGrad" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>

    {/* Pillar 1 (Left bar with rounded base) */}
    <rect
      x="12"
      y="50"
      width="18"
      height="38"
      rx="6"
      fill="url(#growthGrad)"
    />

    {/* Pillar 2 (Middle bar with rounded base) */}
    <rect
      x="41"
      y="54"
      width="18"
      height="34"
      rx="6"
      fill="url(#growthGrad)"
    />

    {/* Pillar 3 (Right vertical stem with rounded base) */}
    <rect
      x="70"
      y="44"
      width="18"
      height="44"
      rx="6"
      fill="url(#growthGrad)"
    />

    {/* Ascending Trend Line 'M' Ridge connecting the bars */}
    <path
      d="M 12 50 
         L 36 28 
         L 50 44 
         L 72 20 
         L 72 38 
         L 88 38 
         L 88 12 
         L 70 30 
         L 50 50 
         L 36 38 
         L 12 60 
         Z"
      fill="url(#growthGrad)"
      opacity="0"
    />

    {/* Dynamic Vector Growth Arrow Line (The Ascending 'M' Crest) */}
    <path
      d="M 12 54
         L 34 32
         L 48 46
         L 76 18
         L 76 30
         L 86 30
         L 86 8
         L 64 8
         L 64 18
         L 72 18
         L 48 42
         L 34 28
         L 12 50
         Z"
      fill="url(#growthGrad)"
      opacity="0"
    />

    {/* Precision-modeled Growth Mark Silhouette (Single seamless path matching original logo) */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M 12 48
         L 34 26
         C 35.5 24.5 38 24.5 39.5 26
         L 49 35.5
         L 68 16
         L 64 16
         C 61.8 16 60 14.2 60 12
         C 60 9.8 61.8 8 64 8
         L 88 8
         C 90.2 8 92 9.8 92 12
         L 92 36
         C 92 38.2 90.2 40 88 40
         C 85.8 40 84 38.2 84 36
         L 84 32
         L 70 46
         C 68.5 47.5 66 47.5 64.5 46
         L 55 36.5
         L 36.5 55
         C 35 56.5 32.5 56.5 31 55
         L 12 36
         L 12 48
         Z"
      fill="url(#growthGrad)"
      opacity="0"
    />

    {/* Primary Growth Mark Vector Shape */}
    {/* 1. Left Lower Bar */}
    <path
      d="M 12 50 L 30 34 L 30 82 C 30 85.3 27.3 88 24 88 L 18 88 C 14.7 88 12 85.3 12 82 Z"
      fill="url(#growthGrad)"
    />

    {/* 2. Middle Lower Bar */}
    <path
      d="M 41 54 L 59 38 L 59 82 C 59 85.3 56.3 88 53 88 L 47 88 C 43.7 88 41 85.3 41 82 Z"
      fill="url(#growthGrad)"
    />

    {/* 3. Right Lower Bar */}
    <path
      d="M 70 42 L 88 26 L 88 82 C 88 85.3 85.3 88 82 88 L 76 88 C 72.7 88 70 85.3 70 82 Z"
      fill="url(#growthGrad)"
    />

    {/* 4. Sharp Ascending Arrow Crest */}
    <path
      d="M 12 46 
         L 34 24 
         L 51 41 
         L 76 16
         L 67 16
         L 67 10
         L 92 10
         L 92 35
         L 86 35
         L 86 26
         L 51 61
         L 34 44
         L 12 66
         Z"
      fill="url(#growthGrad)"
    />
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
}) => {
  const iconPixel = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;

  return (
    <div className={`flex items-center gap-2.5 bg-transparent select-none ${className}`}>
      {/* Transparent-background SVG Growth Mark */}
      <GrowthMarkIcon size={iconPixel} />

      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors">
            My Finance <span className="text-emerald-600 dark:text-emerald-400">Manager</span>
          </span>
        </div>
      )}
    </div>
  );
};
