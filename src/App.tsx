import React, { useState, useEffect } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/home/HeroSection';
import { OrderModesBar } from './components/home/OrderModesBar';
import { OffersSection } from './components/home/OffersSection';
import { MenuSection } from './components/menu/MenuSection';
import { AboutSection } from './components/home/AboutSection';
import { GallerySection } from './components/home/GallerySection';
import { ReviewsSection } from './components/home/ReviewsSection';
import { ReservationAndBlogSection } from './components/home/ReservationAndBlogSection';
import { LocationFaqSection } from './components/home/LocationFaqSection';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { CateringModal } from './components/home/CateringModal';
import { AdminModal } from './components/admin/AdminModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ChatbotWidget } from './components/common/ChatbotWidget';
import { WebsiteAudioPlayer } from './components/common/WebsiteAudioPlayer';

const MainLayout: React.FC = () => {
  const { data } = useRestaurant();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCateringOpen, setIsCateringOpen] = useState(false);

  // Sync dynamic theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (data.profile.primaryColor) {
      root.style.setProperty('--primary', data.profile.primaryColor);
    }
    if (data.profile.secondaryColor) {
      root.style.setProperty('--secondary', data.profile.secondaryColor);
    }
    if (data.profile.accentColor) {
      root.style.setProperty('--green', data.profile.accentColor);
    }
    if (data.seo?.metaTitle) {
      document.title = data.seo.metaTitle;
    }
  }, [
    data.profile.primaryColor,
    data.profile.secondaryColor,
    data.profile.accentColor,
    data.seo?.metaTitle,
  ]);

  // Sync #admin hash with Admin Dashboard state
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    if (window.location.hash !== '#admin') {
      window.location.hash = 'admin';
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-white text-[#444444] selection:bg-[#e8281a] selection:text-white">
      {/* Sarab Topbar + Sticky Navbar + Full-Screen Search Overlay */}
      <Navbar onOpenAdmin={handleOpenAdmin} isAdminOpen={isAdminOpen} />

      {/* Sarab Public Website Sections in Exact Template Order */}
      <main className="flex-1 w-full min-w-0 max-w-[100vw] overflow-x-hidden">
        {/* 1. Hero Section + Red Marquee Ticker */}
        {data.websiteSections.showHero && <HeroSection />}

        {/* 2. Browse by Category (#category) */}
        {data.websiteSections.showOrderModes && <OrderModesBar />}

        {/* 3. About Section (#about) */}
        {data.websiteSections.showAbout && <AboutSection />}

        {/* 4. Our Delicious Menu (#menu) + Dish Detail Popup (#menuPop) */}
        <MenuSection />

        {/* 5. Special Deal Banner with Live Countdown (#special) */}
        {data.websiteSections.showSpecialOffers && <OffersSection />}

        {/* 6. Food Showcase Gallery (#gallery) + History Timeline (#history) + Chefs (#chefs) */}
        <GallerySection />

        {/* 7. Opening Hours (#hours) + Customer Feedback (#testimonials) */}
        <ReviewsSection />

        {/* 8. Make a Reservation (#reservation) + Latest Blog (#blog) + Newsletter (#newsletter) */}
        <ReservationAndBlogSection />

        {/* 9. Contact Us (#contact-section) + FAQ (#faq) */}
        <LocationFaqSection onOpenCatering={() => setIsCateringOpen(true)} />
      </main>

      {/* 10. Sarab Dark Footer + Floating Cart + Back to Top */}
      {data.websiteSections.showFooter && <Footer onOpenAdmin={handleOpenAdmin} />}

      {/* Live Verified Assistant Chatbot Widget */}
      <ChatbotWidget />

      {/* Website Welcome Audio & Voice Announcement Player */}
      <WebsiteAudioPlayer />

      {/* Cart Drawer (WhatsApp & Admin Panel Checkout) */}
      <CartDrawer />

      {/* Party / Catering Inquiries Modal */}
      <CateringModal
        isOpen={isCateringOpen}
        onClose={() => setIsCateringOpen(false)}
      />

      {/* Full-Screen Sarab-Themed Admin Dashboard */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <RestaurantProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </RestaurantProvider>
    </ErrorBoundary>
  );
}
