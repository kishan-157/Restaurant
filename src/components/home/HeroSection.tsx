import React from 'react';
import { Star, Utensils, CalendarCheck, Flame, Clock } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

export const HeroSection: React.FC = () => {
  const { data } = useRestaurant();
  const { profile } = data;
  const hero = data.sectionContents?.hero || DEFAULT_RESTAURANT_DATA.sectionContents!.hero;

  const heroImg =
    profile.heroImageUrl && profile.heroImageUrl.trim() !== ''
      ? profile.heroImageUrl
      : 'https://preview.themewagon.com/sarab/img/banner-img.jpg';

  const highlights =
    hero.highlights && hero.highlights.length > 0
      ? hero.highlights
      : DEFAULT_RESTAURANT_DATA.sectionContents!.hero.highlights;

  const floatingBadges =
    hero.floatingBadges && hero.floatingBadges.length >= 3
      ? hero.floatingBadges
      : [
          { title: 'Hot Deal', subtitle: '30% off today' },
          { title: '4.9/5', subtitle: '2k+ reviews' },
          { title: '20 min', subtitle: 'Fast delivery' },
        ];

  const marqueeItems =
    hero.marqueeItems && hero.marqueeItems.length > 0
      ? hero.marqueeItems
      : [
          'Crispy Fried Chicken',
          'Gourmet Burgers',
          'Artisan Pizzas',
          'Fresh Wraps & Rolls',
          'Loaded Fries',
          'Ice Cream Shakes',
          'Grilled Sandwiches',
        ];

  return (
    <>
      {/* ===================== SARAB HERO SECTION (#hero) ===================== */}
      <section
        id="hero"
        className="relative overflow-hidden bg-[#fff8f0] min-h-[84vh] flex items-center py-12 lg:py-20"
      >
        {/* Floating Soft Radial Shapes */}
        <div
          className="absolute -top-24 -right-20 w-[480px] h-[480px] rounded-full pointer-events-none animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(232, 40, 26, 0.07), transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-12 left-[8%] w-[280px] h-[280px] rounded-full pointer-events-none animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(246, 166, 35, 0.09), transparent 70%)',
          }}
        />

        {/* Giant Watermark Background Text */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[22vw] font-black font-heading text-black/[0.035] pointer-events-none select-none whitespace-nowrap leading-none"
        >
          {hero.watermarkText || 'FOOD'}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Sarab Badge, Display Title, Clean Actions & 4 Stats */}
            <div className="lg:col-span-6 space-y-6">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2.5 bg-white rounded-full py-1.5 pl-1.5 pr-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${profile.primaryColor || '#e8281a'}, ${
                      profile.secondaryColor || '#f6a623'
                    })`,
                  }}
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                </div>
                <span className="text-xs font-semibold text-[#1a1a1a]">
                  {hero.kicker || '#1 Rated Fast Food Restaurant in New York'}
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-heading text-[clamp(2.4rem,5.2vw,4.4rem)] font-black text-[#1a1a1a] leading-[1.1]">
                {hero.titlePrefix || 'Delicious'}{' '}
                <span
                  className="relative inline-block z-10 after:content-[''] after:absolute after:bottom-1 after:left-0 after:right-0 after:h-2 after:bg-[#e8281a]/15 after:rounded-sm after:-z-10"
                  style={{ color: profile.primaryColor || '#e8281a' }}
                >
                  {hero.titleHighlight || 'Fast Food'}
                </span>
                <br />
                {hero.titleSuffix || 'for Every Moment'}
              </h1>

              {/* Description */}
              <p className="text-[#666666] text-sm sm:text-base leading-[1.8] max-w-[480px]">
                {hero.description || profile.description}
              </p>

              {/* Streamlined CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <a href="#menu" className="btn-red">
                  <Utensils className="w-4 h-4" />
                  <span>{hero.primaryButtonText || 'Explore Menu'}</span>
                </a>

                <a
                  href="#reservation"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-white border border-neutral-200 text-sm font-semibold shadow-xs transition-all"
                >
                  <CalendarCheck className="w-4 h-4 text-[#e8281a]" />
                  <span>{hero.secondaryButtonText || 'Book a Table'}</span>
                </a>
              </div>

              {/* 4 Customizable Stats Row */}
              <div className="pt-4 flex flex-wrap items-center gap-5 sm:gap-6">
                {highlights.map((stat, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <div className="w-px h-9 bg-[#dddddd] hidden sm:block" />}
                    <div>
                      <span className="font-heading text-2xl sm:text-3xl font-black text-[#1a1a1a] block leading-none">
                        {stat.title}
                      </span>
                      <small className="text-[11px] text-[#888888] uppercase tracking-wider">
                        {stat.label}
                      </small>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right Column: Circular Hero Image + 3 Customizable Floating Cards */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-[460px] flex items-center justify-center">
                {/* Circular Showcase */}
                <div
                  className="w-[290px] h-[290px] sm:w-[410px] sm:h-[410px] lg:w-[450px] lg:h-[450px] rounded-full flex items-center justify-center relative shadow-[0_28px_76px_rgba(232,40,26,0.14)]"
                  style={{
                    background: 'radial-gradient(circle at 40% 40%, #fff8f0, #ffe5c8)',
                  }}
                >
                  <img
                    src={heroImg}
                    alt={profile.name || 'Sarab Signature Dish'}
                    fetchPriority="high"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80';
                    }}
                    className="w-[90%] h-[90%] object-cover rounded-full shadow-inner"
                  />
                </div>

                {/* Floating Card 1 */}
                <div className="absolute top-4 left-0 sm:-left-3 bg-white rounded-xl py-2.5 px-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-2.5 animate-float-badge-1">
                  <div className="w-9 h-9 rounded-lg bg-[#e8281a]/12 text-[#e8281a] flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs sm:text-sm text-[#1a1a1a] block leading-none">
                      {floatingBadges[0]?.title || 'Hot Deal'}
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      {floatingBadges[0]?.subtitle || '30% off today'}
                    </span>
                  </div>
                </div>

                {/* Floating Card 2 */}
                <div className="absolute bottom-8 right-0 sm:-right-4 bg-white rounded-xl py-2.5 px-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-2.5 animate-float-badge-2">
                  <div className="w-9 h-9 rounded-lg bg-[#f6a623]/15 text-[#f6a623] flex items-center justify-center">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs sm:text-sm text-[#1a1a1a] block leading-none">
                      {floatingBadges[1]?.title || '4.9/5'}
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      {floatingBadges[1]?.subtitle || '2k+ reviews'}
                    </span>
                  </div>
                </div>

                {/* Floating Card 3 */}
                <div className="absolute top-[36%] right-0 sm:-right-6 bg-white rounded-xl py-2.5 px-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-2.5 animate-float-badge-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2d6a4f]/12 text-[#2d6a4f] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs sm:text-sm text-[#1a1a1a] block leading-none">
                      {floatingBadges[2]?.title || '20 min'}
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      {floatingBadges[2]?.subtitle || 'Fast delivery'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SARAB RED MARQUEE STRIP (.mqsec) ===================== */}
      <div
        className="py-3.5 overflow-hidden select-none"
        style={{ backgroundColor: profile.primaryColor || '#e8281a' }}
      >
        <div className="mqtrack">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-3 text-white text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-white/55 inline-block" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
