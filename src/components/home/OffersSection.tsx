import React, { useState, useEffect } from 'react';
import { ShoppingCart, Copy, Check } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

export const OffersSection: React.FC = () => {
  const { data } = useRestaurant();
  const deal =
    data.sectionContents?.specialDeal || DEFAULT_RESTAURANT_DATA.sectionContents!.specialDeal!;

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: deal.countdownHours ?? 8,
    minutes: deal.countdownMinutes ?? 45,
    seconds: deal.countdownSeconds ?? 30,
  });

  useEffect(() => {
    setTimeLeft({
      hours: deal.countdownHours ?? 8,
      minutes: deal.countdownMinutes ?? 45,
      seconds: deal.countdownSeconds ?? 30,
    });
  }, [deal.countdownHours, deal.countdownMinutes, deal.countdownSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return {
          hours: deal.countdownHours ?? 8,
          minutes: deal.countdownMinutes ?? 45,
          seconds: deal.countdownSeconds ?? 30,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deal.countdownHours, deal.countdownMinutes, deal.countdownSeconds]);

  if (!data.websiteSections.showSpecialOffers) return null;

  const activeOffers = data.offers.filter((o) => o.isActive);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section
      id="special"
      className="relative overflow-hidden py-18 sm:py-22"
      style={{
        background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)',
      }}
    >
      {/* Subtle Diagonal Pattern Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Customizable Special Deal & Countdown */}
          <div className="lg:col-span-6 space-y-5">
            <span className="inline-block bg-[#f6a623] text-[#1a1a1a] rounded-md px-4 py-1 text-xs font-bold uppercase tracking-[2px]">
              {deal.badge || 'Limited Time Offer'}
            </span>

            <h2 className="font-heading text-[clamp(2.2rem,5vw,3.7rem)] font-black text-white leading-[1.1]">
              {deal.titleLine1 || 'Special Burger'}{' '}
              <span className="text-[#f6a623]">{deal.titleHighlight || 'Combo Deal'}</span>
              <br />
              {deal.titleLine2 || '30% Off Today!'}
            </h2>

            <p className="text-white/65 text-sm sm:text-[15px] leading-[1.8] max-w-xl">
              {deal.description}
            </p>

            {/* Countdown Boxes */}
            <div className="flex items-center gap-3.5 py-2">
              <div className="text-center bg-white/[0.07] border border-white/12 rounded-xl py-3.5 px-4 min-w-[74px]">
                <span className="font-heading text-3xl sm:text-4xl font-black text-white block leading-none tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1 block">
                  Hours
                </span>
              </div>

              <div className="text-center bg-white/[0.07] border border-white/12 rounded-xl py-3.5 px-4 min-w-[74px]">
                <span className="font-heading text-3xl sm:text-4xl font-black text-white block leading-none tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1 block">
                  Minutes
                </span>
              </div>

              <div className="text-center bg-white/[0.07] border border-white/12 rounded-xl py-3.5 px-4 min-w-[74px]">
                <span className="font-heading text-3xl sm:text-4xl font-black text-white block leading-none tabular-nums">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1 block">
                  Seconds
                </span>
              </div>
            </div>

            <div className="pt-1">
              <a href="#menu" className="btn-red">
                <ShoppingCart className="w-4 h-4" />
                <span>{deal.buttonText || 'Grab the Deal'}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Glowing Deal Image & Pulsing Price Badge */}
          <div className="lg:col-span-6 relative text-center flex items-center justify-center">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(246, 166, 35, 0.24), transparent 70%)',
              }}
            />

            <div className="relative inline-block">
              <div className="absolute -top-2 -left-2 sm:top-4 sm:left-4 z-20 bg-[#e8281a] text-white w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center text-center shadow-[0_8px_24px_rgba(232,40,26,0.5)] animate-pulse-badge">
                <span className="text-[11px] line-through opacity-75">
                  {deal.originalPrice || '$24.99'}
                </span>
                <span className="text-xl font-black leading-none">{deal.dealPrice || '$17.49'}</span>
              </div>

              <img
                src={deal.imageUrl || 'https://preview.themewagon.com/sarab/img/off-img.jpg'}
                alt="Special Combo Deal"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80';
                }}
                className="relative z-10 w-full max-w-[420px] rounded-3xl object-cover animate-float-img drop-shadow-[0_28px_56px_rgba(246,166,35,0.28)]"
              />
            </div>
          </div>
        </div>

        {/* Active Coupon Codes Row */}
        {activeOffers.length > 0 && (
          <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {activeOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.09] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#f6a623] text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider">
                      {offer.discountBadge}
                    </span>
                    <span className="text-[11px] text-white/50">{offer.validUntil}</span>
                  </div>
                  <h4 className="font-heading text-lg font-bold text-white">{offer.title}</h4>
                  <p className="text-xs text-white/65 mt-1 leading-relaxed">{offer.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#f6a623] bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    {offer.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="px-3 py-1.5 rounded-lg bg-[#e8281a] hover:bg-[#c01e12] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode === offer.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
