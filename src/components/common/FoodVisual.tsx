import React, { useState } from 'react';

interface FoodVisualProps {
  imageUrl?: string;
  title: string;
  category?: string;
  isVeg?: boolean;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export const FoodVisual: React.FC<FoodVisualProps> = ({
  imageUrl,
  title,
  category = 'starters',
  isVeg,
  className = '',
  aspectRatio = '4:3',
}) => {
  const [imageError, setImageError] = useState(false);

  const aspectClass =
    aspectRatio === '16:9'
      ? 'aspect-[16/9]'
      : aspectRatio === '1:1'
      ? 'aspect-square'
      : 'aspect-[4/3]';

  // If valid image provided and no error, render img
  if (imageUrl && !imageError && imageUrl.trim().startsWith('http')) {
    return (
      <div className={`relative overflow-hidden bg-neutral-100 ${aspectClass} ${className}`}>
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
    );
  }

  // Styled SVG Fallback Container matching domain guidance
  const getThemeGradient = () => {
    const c = category.toLowerCase();
    if (c.includes('biryani')) {
      return 'from-amber-900/90 via-amber-800 to-yellow-950 text-amber-200';
    }
    if (c.includes('curry') || c.includes('dal')) {
      return 'from-orange-950 via-stone-900 to-amber-950 text-orange-200';
    }
    if (c.includes('bread')) {
      return 'from-stone-900 via-amber-950 to-neutral-900 text-amber-100';
    }
    if (c.includes('dessert') || c.includes('sweet')) {
      return 'from-rose-950 via-stone-900 to-amber-950 text-rose-200';
    }
    if (c.includes('beverage') || c.includes('drink')) {
      return 'from-emerald-950 via-stone-900 to-teal-950 text-emerald-200';
    }
    return 'from-stone-900 via-neutral-900 to-amber-950 text-amber-200';
  };

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${getThemeGradient()} flex flex-col items-center justify-center p-4 text-center select-none ${aspectClass} ${className}`}
    >
      {/* Background pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Decorative center icon graphic */}
      <div className="relative z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center mb-2 shadow-inner">
        {category.toLowerCase().includes('biryani') ? (
          <svg className="w-6 h-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 0a6 6 0 016 6v3H6v-3a6 6 0 016-6zm0 0V3m-7 15h14a2 2 0 012 2H3a2 2 0 012-2z" />
          </svg>
        ) : category.toLowerCase().includes('bread') ? (
          <svg className="w-6 h-6 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m-6-3h4m-4 6h4" />
          </svg>
        ) : isVeg ? (
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
          </svg>
        )}
      </div>

      <span className="relative z-10 text-xs font-semibold tracking-wide uppercase opacity-80 px-2 line-clamp-1">
        {category}
      </span>
      <span className="relative z-10 text-sm font-medium text-white/95 px-3 line-clamp-2 mt-0.5">
        {title}
      </span>
    </div>
  );
};
