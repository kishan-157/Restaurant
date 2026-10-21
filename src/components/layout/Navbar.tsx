import React, { useState } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Shield, Phone } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, isAdminOpen }) => {
  const { data } = useRestaurant();
  const { profile, orderSettings } = data;
  const { totalCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line wordmark */}
        <a
          href="#home"
          className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 font-heading hover:text-amber-800 transition-colors"
        >
          {profile.name}
        </a>

        {/* Zone 2: 4-5 single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
          <a
            href="#menu"
            className="hover:text-amber-800 transition-colors whitespace-nowrap shrink-0"
          >
            Menu
          </a>
          {data.websiteSections.showAbout && (
            <a
              href="#about"
              className="hover:text-amber-800 transition-colors whitespace-nowrap shrink-0"
            >
              Our Story
            </a>
          )}
          {data.websiteSections.showSpecialOffers && (
            <a
              href="#offers"
              className="hover:text-amber-800 transition-colors whitespace-nowrap shrink-0"
            >
              Offers
            </a>
          )}
          {data.websiteSections.showTestimonials && (
            <a
              href="#reviews"
              className="hover:text-amber-800 transition-colors whitespace-nowrap shrink-0"
            >
              Reviews
            </a>
          )}
          <a
            href="#location"
            className="hover:text-amber-800 transition-colors whitespace-nowrap shrink-0"
          >
            Visit Us
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Admin Access button */}
          <button
            onClick={onOpenAdmin}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isAdminOpen
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'text-neutral-700 border-neutral-300 hover:bg-neutral-100'
            }`}
            title="Open Restaurant Owner Admin Panel"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Owner</span> Admin
          </button>

          {/* Cart Primary CTA */}
          {orderSettings.enableCartAndCheckout && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalCount > 0 && (
                <span className="inline-flex items-center justify-center bg-white text-amber-900 font-bold text-[11px] rounded-full h-5 min-w-5 px-1 tabular-nums">
                  {totalCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile menu hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <a
            href="#menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-800 hover:text-amber-800"
          >
            Digital Menu
          </a>
          {data.websiteSections.showAbout && (
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-neutral-800 hover:text-amber-800"
            >
              Our Story & Heritage
            </a>
          )}
          {data.websiteSections.showSpecialOffers && (
            <a
              href="#offers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-neutral-800 hover:text-amber-800"
            >
              Special Offers & Deals
            </a>
          )}
          {data.websiteSections.showTestimonials && (
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-neutral-800 hover:text-amber-800"
            >
              Customer Reviews
            </a>
          )}
          <a
            href="#location"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-800 hover:text-amber-800"
          >
            Location & Opening Hours
          </a>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              {profile.phone}
            </span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="text-amber-800 font-semibold flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Admin Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
