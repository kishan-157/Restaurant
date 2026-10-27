import React from 'react';
import { Leaf, Award, Truck, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

export const AboutSection: React.FC = () => {
  const { data } = useRestaurant();
  const { profile } = data;
  const about = data.sectionContents?.about || DEFAULT_RESTAURANT_DATA.sectionContents!.about;

  if (!data.websiteSections.showAbout) return null;

  const mainAboutImg =
    about.mainImageUrl && about.mainImageUrl.trim() !== ''
      ? about.mainImageUrl
      : 'https://preview.themewagon.com/sarab/img/about.jpg';

  const secondaryImg =
    about.secondaryImageUrl && about.secondaryImageUrl.trim() !== ''
      ? about.secondaryImageUrl
      : 'https://preview.themewagon.com/sarab/img/menu/1.jpg';

  const features = [
    {
      icon: Leaf,
      title: about.box1Title || '100% Fresh Daily',
      desc: about.box1Desc || 'Locally sourced farm produce & organic meats',
    },
    {
      icon: Award,
      title: about.box2Title || 'Master Chefs',
      desc: about.box2Desc || 'Award-winning culinary team with 12+ yrs craft',
    },
    {
      icon: Truck,
      title: about.feature1Title || '20-Min Express Delivery',
      desc: about.feature1Desc || 'Piping-hot food delivered straight to your door',
    },
    {
      icon: UtensilsCrossed,
      title: about.feature2Title || 'Signature Secret Sauces',
      desc: about.feature2Desc || '15 house-made sauces prepared fresh every morning',
    },
  ];

  return (
    <section id="about" className="py-18 sm:py-22 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Sarab Stacked Image Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-[18px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
              <img
                src={mainAboutImg}
                alt="About Sarab Restaurant"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80';
                }}
                className="w-full h-[340px] sm:h-[430px] object-cover block"
              />
            </div>

            {/* Overlapping Secondary Image Card */}
            <div className="hidden sm:block absolute -bottom-7 -right-5 w-48 h-48 rounded-2xl overflow-hidden border-6 border-white shadow-[0_14px_40px_rgba(0,0,0,0.2)]">
              <img
                src={secondaryImg}
                alt="Signature Dish"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Red Experience Badge */}
            <div className="absolute top-6 left-6 bg-gradient-to-br from-[#e8281a] to-[#c01e12] text-white rounded-2xl py-3.5 px-5 shadow-[0_10px_28px_rgba(232,40,26,0.4)] text-center">
              <span className="font-heading text-3xl font-black block leading-none">
                {about.experienceYears || '12+'}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                {about.experienceLabel || 'Years of Craft'}
              </span>
            </div>
          </div>

          {/* Right Column: Sarab Story & 4 Feature Boxes */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="slbl">{about.kicker || 'Our Story'}</span>
              <h2 className="stitle">
                {about.title ? (
                  about.title
                ) : (
                  <>
                    Where Passion Meets <span>Every Plate</span>
                  </>
                )}
              </h2>
              <div className="sline lft" />
            </div>

            <p className="text-[#666666] text-sm sm:text-[15px] leading-[1.85]">
              {about.story || profile.story || profile.description}
            </p>

            {/* 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#fff8f0] border border-[#fef0dc] hover:shadow-md transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading text-base font-bold text-[#1a1a1a]">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-[#777777] mt-0.5 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA & Quote */}
            <div className="pt-3 flex flex-wrap items-center gap-5">
              <a href="#menu" className="btn-red">
                <span>Explore Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="border-l-2 border-[#e8281a] pl-4">
                <span className="font-script text-xl text-[#1a1a1a] block leading-none">
                  {about.chefName || 'Alice Mortal'}
                </span>
                <span className="text-xs text-[#999999]">
                  {about.chefRole || 'Executive Master Chef'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
