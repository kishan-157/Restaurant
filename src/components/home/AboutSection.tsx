import React from 'react';
import { Flame, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { FoodVisual } from '../common/FoodVisual';

export const AboutSection: React.FC = () => {
  const { data } = useRestaurant();
  const { profile } = data;

  if (!data.websiteSections.showAbout) return null;

  return (
    <section id="about" className="py-16 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Left */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-lg">
              <FoodVisual
                imageUrl={profile.logoUrl}
                title="Traditional Awadhi Dum Preparation & Clay Pots"
                category="curry"
                aspectRatio="4:3"
                className="w-full h-80"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                <span className="font-bold text-neutral-900 block">450°C Clay Tandoor</span>
                <span className="text-neutral-500">Charcoal smoked bread & kebabs</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                <span className="font-bold text-neutral-900 block">18 Heirloom Spices</span>
                <span className="text-neutral-500">Stone-ground every morning</span>
              </div>
            </div>
          </div>

          {/* Editorial Content Right */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Culinary Heritage</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-neutral-900 leading-tight [text-wrap:balance]">
              The Art of Slow-Cooked "Dum" & Hand-Ground Spices
            </h2>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              {profile.story || profile.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Slow Clay Handi Simmer</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sealed with dough to preserve moisture and deep aromatic spice notes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Sanctity & Hygiene</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Strict segregation of vegetarian and non-vegetarian preparation areas.
                  </p>
                </div>
              </div>
            </div>

            {/* Quote attribution */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-900 italic">
              "We cook each handi the way royal chefs did centuries ago—with time, patience, and authentic fire."
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
