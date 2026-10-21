import React from 'react';
import { ArrowDown, MessageCircle, Clock, MapPin, Sparkles } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { FoodVisual } from '../common/FoodVisual';

export const HeroSection: React.FC = () => {
  const { data } = useRestaurant();
  const { profile, orderSettings } = data;
  const { setIsCartOpen } = useCart();

  return (
    <section id="home" className="relative overflow-hidden bg-stone-900 text-stone-100 py-12 lg:py-20 border-b border-stone-800">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-orange-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Subtle editorial kicker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{profile.cuisineType}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.city}</span>
            </div>

            {/* Display Headline with balanced wrapping */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-heading leading-tight [text-wrap:balance]">
              {profile.tagline || 'Slow-Cooked Dum Biryanis & Heritage Tandoori Grills'}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl font-light">
              {profile.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#menu"
                className="px-6 py-3.5 text-sm font-semibold text-stone-900 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
              >
                <span>Browse Digital Menu</span>
                <ArrowDown className="w-4 h-4" />
              </a>

              {orderSettings.enableWhatsAppOrdering && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-all shadow-md inline-flex items-center gap-2 border border-emerald-600"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span>Order on WhatsApp</span>
                </button>
              )}
            </div>

            {/* Trust and timing indicators */}
            <div className="pt-6 border-t border-stone-800/80 flex flex-wrap items-center gap-6 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Delivery: {orderSettings.estimatedDeliveryTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{orderSettings.serviceAreaNotes || profile.address}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden p-1 bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 shadow-2xl border border-stone-700/60">
              <FoodVisual
                imageUrl={profile.heroImageUrl}
                title="Awadhi Royal Dum Biryani & Handi Specialties"
                category="biryani"
                aspectRatio="4:3"
                className="w-full h-80 sm:h-96 rounded-xl"
              />

              <div className="p-4 bg-stone-900/90 rounded-b-xl flex items-center justify-between text-xs border-t border-stone-800">
                <div>
                  <span className="font-semibold text-white block">Freshly Ground Spices</span>
                  <span className="text-stone-400">Charcoal slow-cooking daily</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-bold block">{profile.priceRange}</span>
                  <span className="text-stone-400">Pure Cow Ghee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Item Quality Strip below Hero */}
        <div className="mt-12 pt-8 border-t border-stone-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Technique</p>
            <p className="text-sm font-medium text-stone-200">Sealed Clay Dum Handis</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Hygiene</p>
            <p className="text-sm font-medium text-stone-200">Separate Veg & Non-Veg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Doorstep Order</p>
            <p className="text-sm font-medium text-stone-200">Direct WhatsApp Checkout</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Free Delivery</p>
            <p className="text-sm font-medium text-stone-200">
              Orders above {profile.currencySymbol}{orderSettings.freeDeliveryThreshold}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
