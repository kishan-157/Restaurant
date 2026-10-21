import React, { useState } from 'react';
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
import { LocationFaqSection } from './components/home/LocationFaqSection';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { CateringModal } from './components/home/CateringModal';
import { AdminModal } from './components/admin/AdminModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Info, Database, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isConnected, data } = useRestaurant();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCateringOpen, setIsCateringOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 selection:bg-amber-600 selection:text-white">
      {/* Demo Mode / Local Persistence Awareness Ribbon */}
      {!isConnected && (
        <aside aria-label="Demo mode notice" className="bg-amber-950 text-amber-200 text-xs py-2 px-4 border-b border-amber-900/60">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              <span>
                <strong>Master Template (Demo Mode):</strong> Edits persist in this browser. To enable production multi-device cloud persistence, connect your own Supabase project.
              </span>
            </div>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-white bg-amber-800 hover:bg-amber-700 font-semibold px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors"
            >
              Open Database Wizard
            </button>
          </div>
        </aside>
      )}

      {/* Top Navbar */}
      <Navbar onOpenAdmin={() => setIsAdminOpen(true)} isAdminOpen={isAdminOpen} />

      {/* Homepage & Content Sections */}
      <main className="flex-1">
        {data.websiteSections.showHero && <HeroSection />}
        {data.websiteSections.showOrderModes && <OrderModesBar />}
        {data.websiteSections.showSpecialOffers && <OffersSection />}
        <MenuSection />
        {data.websiteSections.showAbout && <AboutSection />}
        {data.websiteSections.showGallery && <GallerySection />}
        {data.websiteSections.showTestimonials && <ReviewsSection />}
        <LocationFaqSection onOpenCatering={() => setIsCateringOpen(true)} />
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Party / Catering Inquiries Modal */}
      <CateringModal
        isOpen={isCateringOpen}
        onClose={() => setIsCateringOpen(false)}
      />

      {/* Complete Owner Admin Panel */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
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
