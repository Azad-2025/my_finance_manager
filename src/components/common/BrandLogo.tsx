import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * High-Precision Transparent SVG Growth Mark Icon
 * Approved brand mark: 3 vertical pillars with rounded bottoms and an ascending trend arrow crest
 * Colors: Emerald Green (#059669 -> #10B981)
 * Seamlessly transparent, zero white box, zero card background, zero border.
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
    <defs>
      <linearGradient id="growthGradMark" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>

    {/* Pillar 1: Left Bar with rounded base */}
    <path
      d="M 14 50 L 30 36 L 30 82 C 30 85.3 27.3 88 24 88 L 20 88 C 16.7 88 14 85.3 14 82 Z"
      fill="url(#growthGradMark)"
    />

    {/* Pillar 2: Middle Bar with rounded base */}
    <path
      d="M 42 54 L 58 40 L 58 82 C 58 85.3 55.3 88 52 88 L 48 88 C 44.7 88 42 85.3 42 82 Z"
      fill="url(#growthGradMark)"
    />

    {/* Pillar 3: Right Bar with rounded base */}
    <path
      d="M 70 42 L 86 28 L 86 82 C 86 85.3 83.3 88 80 88 L 76 88 C 72.7 88 70 85.3 70 82 Z"
      fill="url(#growthGradMark)"
    />

    {/* Ascending Trend Arrow Crest (The dynamic 'M' ridge pointing up-right) */}
    <path
      d="M 14 46 
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
         L 14 64
         Z"
      fill="url(#growthGradMark)"
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
    <div className={`flex items-center gap-2 sm:gap-2.5 bg-transparent select-none min-w-0 ${className}`}>
      {/* Transparent-background SVG Growth Mark (Always visible on all screen sizes) */}
      <GrowthMarkIcon size={iconPixel} />

      {!iconOnly && (
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors truncate">
            My Finance <span className="text-emerald-600 dark:text-emerald-400">Manager</span>
          </span>
        </div>
      )}
    </div>
  );
};
