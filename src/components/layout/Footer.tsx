import React, { useState } from 'react';
import { Instagram, Facebook, MapPin, Phone, Mail, Shield, FileText } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { data } = useRestaurant();
  const { profile, orderSettings, socials } = data;
  const [activePolicyModal, setActivePolicyModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold font-heading text-white tracking-tight">
              {profile.name}
            </h3>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs">
              {profile.tagline || profile.description}
            </p>
            <div className="pt-2 flex items-center gap-3">
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-neutral-900 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-neutral-900 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {profile.googleMapsUrl && (
                <a
                  href={profile.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-neutral-900 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Google Maps"
                >
                  <MapPin className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Quick Navigation</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <a href="#menu" className="hover:text-amber-400 transition-colors">
                  Digital Menu
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-amber-400 transition-colors">
                  Culinary Story
                </a>
              </li>
              <li>
                <a href="#offers" className="hover:text-amber-400 transition-colors">
                  Exclusive Deals
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-amber-400 transition-colors">
                  Customer Reviews
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-amber-400 transition-colors">
                  Opening Hours & Directions
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Direct Contact</h4>
            <div className="space-y-2 text-neutral-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{profile.address}, {profile.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{profile.phone}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{profile.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Col 4: Ordering & Online Platforms */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Delivery & Platforms</h4>
            <p className="text-xs text-neutral-400">
              WhatsApp Direct Order saves third-party commissions and delivers freshly prepared handis.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              {orderSettings.zomatoUrl && (
                <a
                  href={orderSettings.zomatoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white text-neutral-400 transition-colors"
                >
                  → Order on Zomato
                </a>
              )}
              {orderSettings.swiggyUrl && (
                <a
                  href={orderSettings.swiggyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white text-neutral-400 transition-colors"
                >
                  → Order on Swiggy
                </a>
              )}
              <button
                onClick={onOpenAdmin}
                className="mt-2 text-left text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Restaurant Management Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar with policies */}
        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
          <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActivePolicyModal('privacy')}
              className="hover:text-neutral-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              onClick={() => setActivePolicyModal('terms')}
              className="hover:text-neutral-300 transition-colors"
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Policy Modals */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-neutral-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-neutral-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-700" />
                {activePolicyModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <button
                onClick={() => setActivePolicyModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-semibold px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-neutral-600 space-y-3 leading-relaxed">
              {activePolicyModal === 'privacy' ? (
                <>
                  <p>
                    <strong>1. Customer Information:</strong> When you place an order via our WhatsApp ordering feature, your name, contact phone number, and delivery address are formatted directly into your personal WhatsApp application.
                  </p>
                  <p>
                    <strong>2. Zero Tracking or Third-Party Sale:</strong> We do not sell, rent, or trade your personal telephone number or address to third-party advertising brokers.
                  </p>
                  <p>
                    <strong>3. Data Storage:</strong> In Demo / Local mode, data is cached in your browser. When connected to the restaurant owner's Supabase instance, data is secured under PostgreSQL Row Level Security (RLS).
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Direct WhatsApp Ordering:</strong> Placing an order generates a pre-formatted message in WhatsApp. The order is subject to confirmation by the restaurant staff regarding kitchen preparation time and dish availability.
                  </p>
                  <p>
                    <strong>2. Delivery Times & Conditions:</strong> Stated delivery times (e.g. 35-45 minutes) are estimates influenced by peak dinner rush and weather conditions.
                  </p>
                  <p>
                    <strong>3. Cancellation & Hygiene:</strong> As freshly prepared gourmet food, orders can only be cancelled before food preparation commences in our clay tandoors.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
