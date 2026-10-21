import React from 'react';
import { Flame } from 'lucide-react';

interface VegBadgeProps {
  isVeg: boolean;
  size?: 'sm' | 'md';
}

export const VegNonVegBadge: React.FC<VegBadgeProps> = ({ isVeg, size = 'md' }) => {
  const outerSize = size === 'sm' ? 'w-3.5 h-3.5 p-0.5' : 'w-4 h-4 p-0.5';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  if (isVeg) {
    return (
      <span
        title="Pure Vegetarian"
        className={`inline-flex items-center justify-center border border-emerald-600 rounded-[3px] bg-white shrink-0 ${outerSize}`}
      >
        <span className={`rounded-full bg-emerald-600 ${dotSize}`} />
      </span>
    );
  }

  return (
    <span
      title="Non-Vegetarian"
      className={`inline-flex items-center justify-center border border-red-700 rounded-[3px] bg-white shrink-0 ${outerSize}`}
    >
      <span className={`w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-700`} />
    </span>
  );
};

interface SpiceLevelProps {
  level: 0 | 1 | 2 | 3;
}

export const SpiceLevelIndicator: React.FC<SpiceLevelProps> = ({ level }) => {
  if (level === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs text-amber-700"
      title={`Spice Level: ${level === 1 ? 'Mild' : level === 2 ? 'Medium' : 'Hot & Spicy'}`}
    >
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="w-3 h-3 fill-red-600 text-red-600" />
      ))}
      <span className="text-[11px] font-medium ml-0.5 text-neutral-500">
        {level === 1 ? 'Mild' : level === 2 ? 'Med' : 'Spicy'}
      </span>
    </span>
  );
};
