import React, { useState } from 'react';
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ChevronUp,
  ShoppingCart,
  Shield,
  FileText,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { data } = useRestaurant();
  const { profile, categories, socials, orderSettings } = data;
  const { totalCount, subtotal, setIsCartOpen } = useCart();
  const [activePolicyModal, setActivePolicyModal] = useState<'privacy' | 'terms' | null>(null);

  const policyContent =
    data.sectionContents?.policies || DEFAULT_RESTAURANT_DATA.sectionContents!.policies;

  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 6);

  const handleCategoryJump = (catId: string) => {
    window.dispatchEvent(new CustomEvent('sarab:select-category', { detail: catId }));
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <footer className="w-full max-w-[100vw] overflow-hidden bg-[#1a1a1a] text-[#777777] pt-14 sm:pt-16 pb-20 sm:pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1: Brand & Socials */}
            <div>
              <div className="flex items-center gap-3">
                {profile.logoUrl && profile.logoUrl.trim() && (
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0 shadow-md">
                    <img
                      src={profile.logoUrl}
                      alt={profile.name || 'Logo'}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                )}
                <div className="font-heading text-3xl font-black text-white">
                  {profile.name || 'Sarab'}
                  <span style={{ color: profile.primaryColor || '#e8281a' }}>.</span>
                </div>
              </div>
              <p className="text-[#777777] text-[13.5px] leading-[1.8] mt-2.5">
                {profile.description}
              </p>
              <div className="flex items-center gap-2.5 mt-4">
                {[
                  { Icon: Instagram, url: socials.instagram },
                  { Icon: Facebook, url: socials.facebook },
                  { Icon: Twitter, url: socials.twitter },
                  { Icon: Youtube, url: socials.youtube },
                ].map(({ Icon, url }, i) => (
                  <a
                    key={i}
                    href={url || '#hero'}
                    target={url ? '_blank' : undefined}
                    rel="noreferrer"
                    className="w-9 h-9 rounded-[9px] bg-white/[0.06] hover:bg-[#e8281a] text-[#777777] hover:text-white flex items-center justify-center transition-all hover:-translate-y-1"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white text-[15px] font-bold mb-4 pb-2 border-b-2 border-[#e8281a] inline-block">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Home', href: '#hero' },
                  { label: 'About Us', href: '#about' },
                  { label: 'Our Menu', href: '#menu' },
                  { label: 'Special Offers', href: '#special' },
                  { label: 'Book a Table', href: '#reservation' },
                  { label: 'Latest Blog', href: '#blog' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[#777777] hover:text-[#f6a623] text-[13.5px] inline-flex items-center gap-1.5 transition-all hover:pl-1.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#e8281a]" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Dynamic Menu Categories */}
            <div>
              <h4 className="text-white text-[15px] font-bold mb-4 pb-2 border-b-2 border-[#e8281a] inline-block">
                Our Menu
              </h4>
              <ul className="space-y-2.5">
                {activeCategories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => handleCategoryJump(cat.id)}
                      className="text-[#777777] hover:text-[#f6a623] text-[13.5px] inline-flex items-center gap-1.5 transition-all hover:pl-1.5 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#e8281a]" />
                      <span>{cat.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact Info & Admin Portal */}
            <div>
              <h4 className="text-white text-[15px] font-bold mb-4 pb-2 border-b-2 border-[#e8281a] inline-block">
                Contact Info
              </h4>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-[34px] h-[34px] rounded-[7px] bg-[#e8281a]/15 text-[#e8281a] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-[13px] leading-relaxed break-words min-w-0">
                    <strong className="text-[#bbbbbb] block text-xs">Address</strong>
                    <span>
                      {profile.address}, {profile.city}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-[34px] h-[34px] rounded-[7px] bg-[#e8281a]/15 text-[#e8281a] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-[13px] leading-relaxed">
                    <strong className="text-[#bbbbbb] block text-xs">Phone</strong>
                    <span>{profile.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-[34px] h-[34px] rounded-[7px] bg-[#e8281a]/15 text-[#e8281a] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-[13px] leading-relaxed break-all min-w-0">
                    <strong className="text-[#bbbbbb] block text-xs">Email</strong>
                    <span>{profile.email || 'hello@sarabfood.com'}</span>
                  </div>
                </div>

                <button
                  onClick={onOpenAdmin}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.07] hover:bg-[#e8281a] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#f6a623]" />
                  <span>Open {profile.name || 'Sarab'} Admin Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/[0.06] py-5 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777] text-center sm:text-left">
            <p>
              © {new Date().getFullYear()}{' '}
              <span className="text-white font-semibold">{profile.name || 'Sarab'}</span>. All
              Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActivePolicyModal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                onClick={() => setActivePolicyModal('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating My Cart Pill & Back to Top (Placed opposite Chatbot button so they never overlap on mobile) */}
      <div
        className={`fixed bottom-4 sm:bottom-5 ${
          data.chatbotSettings?.position === 'left'
            ? 'right-3 sm:right-6'
            : 'left-3 sm:left-6'
        } z-30 flex items-center gap-2`}
      >
        <button
          id="btt"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1a1a1a] hover:bg-[#e8281a] text-white shadow-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Back to Top"
        >
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {orderSettings.enableCartAndCheckout && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-gradient-to-br from-[#e8281a] to-[#c01e12] text-white rounded-full px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-[0_8px_28px_rgba(232,40,26,0.45)] flex items-center gap-2 text-xs font-bold hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>
              {totalCount > 0
                ? `View Cart & Order (${profile.currencySymbol}${subtotal.toFixed(2)})`
                : 'My Cart'}
            </span>
            <span className="w-5 h-5 rounded-full bg-white text-[#e8281a] flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold tabular-nums">
              {totalCount}
            </span>
          </button>
        )}
      </div>

      {/* Policy Modal */}
      {activePolicyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setActivePolicyModal(null)}
        >
          <div
            className="bg-white text-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#e8281a]" />
                {activePolicyModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <button
                onClick={() => setActivePolicyModal(null)}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
              {activePolicyModal === 'privacy'
                ? policyContent.privacyPolicyText
                : policyContent.termsText}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
