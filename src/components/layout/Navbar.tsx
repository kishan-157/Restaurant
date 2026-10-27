import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Shield,
  Phone,
  MapPin,
  Clock,
  Utensils,
  Flame,
  CalendarCheck,
  Plus,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
}

const TRENDING_TAGS = [
  'Paneer Toofani',
  'Smash Burger',
  'Nashville Chicken',
  'Margherita Pizza',
  'Lava Cake',
  'Truffle Pasta',
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, isAdminOpen }) => {
  const { data, orders, reservations } = useRestaurant();
  const { profile, orderSettings, items, categories, openingHours } = data;
  const { cart, totalCount, subtotal, setIsCartOpen, addToCart } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('hero');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [profile.logoUrl]);

  const pendingActivityCount = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const pendingRes = reservations.filter((r) => r.status === 'pending').length;
    return pendingOrders + pendingRes;
  }, [orders, reservations]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(
        (item) =>
          item.stockStatus !== 'hidden' &&
          (item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))))
      )
      .slice(0, 6);
  }, [items, searchQuery]);

  const handleSelectCategoryFromOverlay = (catId: string) => {
    setSearchOpen(false);
    window.dispatchEvent(new CustomEvent('sarab:select-category', { detail: catId }));
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { id: 'hero', label: 'Home', href: '#hero' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'menu', label: 'Menu', href: '#menu' },
    { id: 'special', label: 'Special', href: '#special' },
    { id: 'gallery', label: 'Gallery', href: '#gallery' },
    { id: 'chefs', label: 'Chefs', href: '#chefs' },
    { id: 'testimonials', label: 'Reviews', href: '#testimonials' },
    { id: 'blog', label: 'Blog', href: '#blog' },
    { id: 'contact-section', label: 'Contact', href: '#contact-section' },
  ];

  const hasCustomLogo = Boolean(profile.logoUrl && profile.logoUrl.trim() && !logoError);

  return (
    <>
      {/* ===================== SARAB TOP BAR (#topbar) ===================== */}
      <div id="topbar" className="w-full overflow-hidden bg-[#111111] text-[#aaaaaa] py-1.5 sm:py-2 text-[11px] sm:text-[12.5px] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center gap-1 hover:text-white transition-colors truncate"
            >
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f6a623] shrink-0" />
              <span className="truncate">{profile.phone}</span>
            </a>
            <span className="hidden md:inline-flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#f6a623] shrink-0" />
              <span className="truncate">
                {profile.address}, {profile.city}
              </span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#f6a623] shrink-0" />
              <span>{openingHours.topbarHoursText || 'Wed-Sun: 9:00 AM - 11:00 PM'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto shrink-0">
            <span
              className="text-white px-2 sm:px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: profile.primaryColor || '#e8281a' }}
            >
              Free Delivery
            </span>
            <span className="text-[11px] sm:text-xs text-[#cccccc] whitespace-nowrap">
              Over {profile.currencySymbol}
              {orderSettings.freeDeliveryThreshold}
            </span>
          </div>
        </div>
      </div>

      {/* ===================== SARAB STICKY NAVBAR (#nav) ===================== */}
      <header
        id="nav"
        className={`sticky top-0 z-40 w-full max-w-[100vw] bg-white/95 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? 'shadow-[0_4px_30px_rgba(0,0,0,0.12)] py-2'
            : 'shadow-[0_2px_20px_rgba(0,0,0,0.06)] py-2.5 sm:py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          {/* Brand Logo (.blogo) */}
          <a href="#hero" className="flex items-center gap-2 sm:gap-2.5 min-w-0 group">
            {hasCustomLogo ? (
              <div className="w-9 h-9 sm:w-[44px] sm:h-[44px] rounded-full overflow-hidden flex items-center justify-center bg-white border border-neutral-200 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                <img
                  src={profile.logoUrl}
                  alt={profile.name || 'Restaurant Logo'}
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 sm:w-[44px] sm:h-[44px] rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(232,40,26,0.35)] group-hover:scale-105 transition-transform shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${profile.primaryColor || '#e8281a'}, ${
                    profile.secondaryColor || '#f6a623'
                  })`,
                }}
              >
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <div className="leading-none min-w-0">
              <span className="font-heading text-lg sm:text-2xl font-black text-[#1a1a1a] tracking-tight block truncate max-w-[160px] sm:max-w-none">
                {profile.name || 'Sarab'}
                <span style={{ color: profile.primaryColor || '#e8281a' }}>.</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[1px] sm:tracking-[2px] text-[#999999] block mt-0.5 truncate max-w-[160px] sm:max-w-none">
                {profile.tagline || 'Fast Food & Dining'}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = activeNav === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setActiveNav(link.id)}
                  className={`relative px-3 py-2 text-[13.5px] font-medium transition-colors group ${
                    isActive
                      ? 'text-[#e8281a] font-semibold'
                      : 'text-[#333333] hover:text-[#e8281a]'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-[#e8281a] rounded-t-sm transition-all duration-300 ${
                      isActive ? 'w-[55%]' : 'w-0 group-hover:w-[55%]'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Right Action Controls (Clean & Mobile-Optimized) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Overlay Trigger (#navSearchBtn) */}
            <button
              id="navSearchBtn"
              onClick={() => setSearchOpen(true)}
              className="p-2 sm:p-2.5 rounded-full text-[#555555] hover:bg-[#fff8f0] hover:text-[#e8281a] transition-colors cursor-pointer"
              title="Search Menu"
              aria-label="Open Search Overlay"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Cart Button */}
            {orderSettings.enableCartAndCheckout && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-[#1a1a1a] bg-[#fff8f0] hover:bg-[#fef0dc] border border-[#f6a623]/30 flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                title="View Cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#e8281a]" />
                <span className="hidden sm:inline">Cart</span>
                <span className="inline-flex items-center justify-center bg-[#e8281a] text-white font-bold text-[10px] rounded-full h-4.5 min-w-4.5 px-1 tabular-nums">
                  {totalCount}
                </span>
              </button>
            )}

            {/* Book a Table CTA (.nav-cta) */}
            <a
              href="#reservation"
              className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-br from-[#e8281a] to-[#c01e12] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-[0_4px_15px_rgba(232,40,26,0.3)] hover:-translate-y-0.5 transition-all"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Book a Table</span>
            </a>

            {/* Single Clean Admin Dashboard Button */}
            <button
              onClick={onOpenAdmin}
              className={`relative px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                isAdminOpen
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-[#e8281a] hover:border-[#e8281a]'
              }`}
              title="Open Sarab Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-[#f6a623]" />
              <span className="hidden md:inline">Admin</span>
              {pendingActivityCount > 0 && (
                <span className="inline-flex items-center justify-center bg-[#f6a623] text-[#1a1a1a] font-extrabold text-[10px] rounded-full h-4 min-w-4 px-1">
                  {pendingActivityCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 sm:p-2 text-[#1a1a1a] hover:bg-[#fff8f0] rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Collapse Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-neutral-100 bg-white px-4 py-4 space-y-3 shadow-xl">
            <div className="grid grid-cols-3 gap-1.5">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => {
                    setActiveNav(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#333333] bg-[#fff8f0]/60 hover:bg-[#e8281a] hover:text-white transition-colors text-center"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
              <a
                href="#reservation"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#e8281a] text-white px-4 py-2.5 rounded-full text-xs font-semibold"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Book a Table</span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white px-4 py-2.5 rounded-full text-xs font-semibold"
              >
                <Shield className="w-3.5 h-3.5 text-[#f6a623]" />
                <span>Admin Panel</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===================== SARAB FULL-SCREEN SEARCH OVERLAY (#searchOv) ===================== */}
      {searchOpen && (
        <div
          id="searchOv"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSearchOpen(false)}
        >
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-[#e8281a] text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Search"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center border-2 border-[#e8281a] rounded-full px-5 py-3 bg-[#fff8f0]">
              <Search className="w-5 h-5 text-[#e8281a] mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search burgers, pizza, chicken..."
                className="w-full bg-transparent text-sm sm:text-base text-[#1a1a1a] placeholder-[#999999] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#999999] hover:text-[#1a1a1a] ml-2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Search Results */}
            {searchQuery.trim() !== '' && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <p className="text-center text-xs text-[#888888] py-4">
                    No menu items matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#fff8f0] hover:bg-[#fef0dc] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || 'https://preview.themewagon.com/sarab/img/menu/1.jpg'}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div>
                          <h5 className="text-sm font-bold text-[#1a1a1a] font-heading">{item.name}</h5>
                          <p className="text-xs text-[#e8281a] font-bold">
                            {profile.currencySymbol}
                            {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(item);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#e8281a] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#c01e12] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {cart.some((c) => c.item.id === item.id)
                            ? `Added (${cart
                                .filter((c) => c.item.id === item.id)
                                .reduce((s, c) => s + c.quantity, 0)})`
                            : 'Add'}
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {totalCount > 0 && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#1a1a1a] text-white text-xs">
                <span>
                  🛒 <strong>{totalCount} items</strong> selected ({profile.currencySymbol}
                  {subtotal.toFixed(2)})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#e8281a] hover:bg-[#c01e12] text-white font-bold cursor-pointer"
                >
                  View Cart &amp; Order →
                </button>
              </div>
            )}

            {/* Dynamic Categories inside Search Box */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#999999] mb-3">
                Browse Categories
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {activeCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategoryFromOverlay(cat.id)}
                    className="group p-2 rounded-xl bg-[#fff8f0] hover:bg-[#e8281a] text-[#1a1a1a] hover:text-white transition-all text-center cursor-pointer"
                  >
                    <img
                      src={cat.imageUrl || 'https://preview.themewagon.com/sarab/img/category/2.jpg'}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      className="w-11 h-11 rounded-full object-cover mx-auto mb-1.5 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-xs font-semibold block truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Searches */}
            <div>
              <p className="text-xs font-semibold text-[#555555] mb-2.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#f6a623] fill-[#f6a623]" />
                <span>Popular Searches</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1 rounded-full bg-[#fff8f0] border border-[#e8281a]/20 hover:bg-[#e8281a] text-[#1a1a1a] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
