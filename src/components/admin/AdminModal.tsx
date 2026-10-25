import React, { useState } from 'react';
import {
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Menu,
  Cloud,
  HardDrive,
  ExternalLink,
  Bell,
  Flame,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AdminSidebar, AdminTabId } from './AdminSidebar';
import { AdminDashboard } from './tabs/AdminDashboard';
import { AdminOrders } from './tabs/AdminOrders';
import { AdminCategories } from './tabs/AdminCategories';
import { AdminMenuItems } from './tabs/AdminMenuItems';
import { AdminVariantsAddons } from './tabs/AdminVariantsAddons';
import { AdminStock } from './tabs/AdminStock';
import { AdminSectionContent } from './tabs/AdminSectionContent';
import { AdminGallery } from './tabs/AdminGallery';
import { AdminSections } from './tabs/AdminSections';
import { AdminRestaurantInfo } from './tabs/AdminRestaurantInfo';
import { AdminBranding } from './tabs/AdminBranding';
import { AdminOrderSettings } from './tabs/AdminOrderSettings';
import { AdminSocials } from './tabs/AdminSocials';
import { AdminSEO } from './tabs/AdminSEO';
import { AdminDatabaseSetup } from './tabs/AdminDatabaseSetup';
import { AdminBackupExport } from './tabs/AdminBackupExport';
import { AdminHelpGuide } from './tabs/AdminHelpGuide';
import { AdminChatbot } from './tabs/AdminChatbot';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_AUTH_KEY = 'sarab_admin_authenticated_v1';

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const {
    data,
    isConnected,
    orders,
    reservations,
    contactMessages,
    resetDefaults,
  } = useRestaurant();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passwordInput.trim();
    if (trimmed === 'admin123' || trimmed === 'sarab123' || trimmed === 'admin') {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      } catch {
        // ignore storage errors
      }
      setLoginError(false);
      setPasswordInput('');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // ignore
    }
  };

  const handleResetConfirm = () => {
    resetDefaults();
    setConfirmResetOpen(false);
    showToast('Default Sarab website data restored.');
  };

  const pendingOrders = orders.filter(
    o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  ).length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const unreadMessages = contactMessages.filter(m => !m.isRead).length;
  const totalAlerts = pendingOrders + pendingReservations + unreadMessages;

  const tabMeta: Record<AdminTabId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Live Restaurant Overview',
      subtitle: '100% real-time orders, table reservations, revenue metrics, and menu status',
    },
    orders: {
      title: 'Orders, Table Reservations & Inquiries',
      subtitle: 'Manage incoming WhatsApp & Direct orders, table bookings, and customer messages',
    },
    stock: {
      title: 'Quick Stock & Availability Toggle',
      subtitle: 'Instantly mark dishes in stock or sold out across the live website',
    },
    categories: {
      title: 'Menu Categories',
      subtitle: 'Customize circular category photos, item count badges, and display order',
    },
    items: {
      title: 'Menu Dishes & Pricing',
      subtitle: 'Add, edit, or toggle availability of dishes, strikethrough prices, calories, and ratings',
    },
    variants: {
      title: 'Dish Sizes, Variants & Add-On Groups',
      subtitle: 'Configure portion sizes and extra toppings for customizable dishes',
    },
    content: {
      title: 'Complete Website Content Studio',
      subtitle: 'Customize Hero, Marquee, About, Deal of the Day, Chefs, Timeline, Blog, Promo Coupons, Reviews & FAQs',
    },
    gallery: {
      title: 'Food & Ambience Photo Gallery',
      subtitle: 'Manage masonry gallery photography and hover captions',
    },
    sections: {
      title: 'Website Section Visibility',
      subtitle: 'Turn any section on the public Sarab website ON or OFF immediately',
    },
    info: {
      title: 'Restaurant Identity, Address & Opening Hours',
      subtitle: 'Update restaurant name, phone, WhatsApp number, address, and weekly hours',
    },
    branding: {
      title: 'Theme Colors & Typography',
      subtitle: 'Customize Sarab crimson, golden amber, forest green, and font pairings',
    },
    ordersettings: {
      title: 'Ordering Channels, Delivery Fees & WhatsApp Routing',
      subtitle: 'Control WhatsApp vs Admin Direct checkout, delivery fees, and minimum order rules',
    },
    socials: {
      title: 'Social Media & Review Links',
      subtitle: 'Configure Instagram, Facebook, YouTube, and Google Business links',
    },
    seo: {
      title: 'Search Engine Optimization (SEO)',
      subtitle: 'Customize browser title, meta description, keywords, and social share image',
    },
    chatbot: {
      title: 'Restaurant Smart Chatbot Studio',
      subtitle: 'Customize automatic website Q&A replies, in-chat order confirmation, live order status tracking & quick buttons',
    },
    database: {
      title: 'Supabase Real-Time Cloud Sync',
      subtitle: 'Connect your Supabase PostgreSQL project for live multi-device synchronization',
    },
    backup: {
      title: 'Database Backup & JSON Export',
      subtitle: 'Export or import your complete website configuration and menu bundle',
    },
    help: {
      title: 'Admin Studio Guide',
      subtitle: 'Instructions for managing your Sarab website and Supabase database',
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#fff8f0] text-[#1a1a1a] flex overflow-hidden animate-fadeIn"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#1a1a1a] text-white text-sm font-medium shadow-2xl border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-[#f6a623] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#e0d6c8] shadow-2xl">
            <div className="flex items-center gap-3 text-[#e8281a] mb-3">
              <div className="w-11 h-11 rounded-2xl bg-[#e8281a]/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#e8281a]" />
              </div>
              <h4
                className="font-bold text-xl text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Restore Default Sarab Content?
              </h4>
            </div>
            <p className="text-sm text-[#7a6e65] mb-6 leading-relaxed">
              This will reset all website text, categories, dishes, chefs, timeline, and theme settings back to the original Sarab template defaults.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5a524c] bg-[#f9f5f0] hover:bg-[#efe8df] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#e8281a] hover:bg-[#c01f12] text-white shadow-md transition-all"
              >
                Yes, Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAdminAuthenticated ? (
        /* Sarab-Themed Login Screen */
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#fff8f0] relative overflow-y-auto">
          <button
            onClick={onClose}
            className="fixed top-6 right-6 z-20 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all text-xs font-semibold shadow-md border border-[#e0d6c8] cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </button>

          <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 border border-[#e0d6c8] shadow-[0_20px_60px_rgba(26,26,26,0.08)]">
            <div className="w-16 h-16 rounded-2xl bg-[#e8281a] text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#e8281a]/30">
              <Flame className="w-8 h-8" />
            </div>
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e8281a] block mb-1">
                {data.profile.name || 'Sarab'} Admin Studio
              </span>
              <h2
                className="text-3xl font-black text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Manager Sign In
              </h2>
              <p className="text-xs text-[#7a6e65] mt-2">
                Manage real-time orders, table reservations, menu dishes, and full website customization.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5a524c] mb-2">
                  Admin Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7a6e65] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setLoginError(false);
                    }}
                    placeholder="Enter passcode (default: admin123)"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#e8281a] transition-all"
                    autoFocus
                  />
                </div>
                {loginError && (
                  <p className="text-xs text-[#e8281a] mt-2 font-medium">
                    Incorrect passcode. Default passcode is <span className="font-bold">admin123</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-sm transition-all shadow-lg shadow-[#e8281a]/25 cursor-pointer"
              >
                Open Admin Dashboard
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Full-Screen Sarab-Themed Admin Dashboard */
        <div className="flex-1 flex h-full w-full overflow-hidden">
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <AdminSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onCloseAdmin={onClose}
            onLogout={handleLogout}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fff8f0]">
            {/* Top Bar */}
            <header className="px-4 sm:px-8 py-4 bg-white border-b border-[#e0d6c8]/80 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] flex items-center justify-center text-[#1a1a1a]"
                  aria-label="Open navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="truncate">
                  <h1
                    className="text-lg sm:text-2xl font-black text-[#1a1a1a] truncate"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {tabMeta[activeTab].title}
                  </h1>
                  <p className="text-xs text-[#7a6e65] hidden sm:block truncate">
                    {tabMeta[activeTab].subtitle}
                  </p>
                </div>
              </div>

              {/* Right Quick Controls */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                {/* Quick Jump Search */}
                <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] w-60">
                  <Search className="w-4 h-4 text-[#7a6e65] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      const q = val.toLowerCase();
                      if (q.includes('dish') || q.includes('menu') || q.includes('price'))
                        setActiveTab('items');
                      else if (q.includes('cat')) setActiveTab('categories');
                      else if (q.includes('order') || q.includes('book') || q.includes('reserv'))
                        setActiveTab('orders');
                      else if (
                        q.includes('hero') ||
                        q.includes('chef') ||
                        q.includes('blog') ||
                        q.includes('about') ||
                        q.includes('faq') ||
                        q.includes('offer')
                      )
                        setActiveTab('content');
                      else if (q.includes('chat') || q.includes('bot')) setActiveTab('chatbot');
                      else if (q.includes('color') || q.includes('theme')) setActiveTab('branding');
                      else if (q.includes('supa') || q.includes('sql') || q.includes('sync'))
                        setActiveTab('database');
                    }}
                    placeholder="Jump to menu, hero, chefs, orders..."
                    className="bg-transparent text-xs text-[#1a1a1a] placeholder-[#7a6e65] focus:outline-none w-full"
                  />
                </div>

                {/* Live Sync Status Pill */}
                <button
                  onClick={() => setActiveTab('database')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] border-[#2d6a4f]/30'
                      : 'bg-[#f6a623]/15 text-[#9a6200] border-[#f6a623]/30'
                  }`}
                  title="Database Sync Status"
                >
                  {isConnected ? (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-[#2d6a4f]" />
                      <span className="hidden md:inline">Supabase Live</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3.5 h-3.5 text-[#9a6200]" />
                      <span className="hidden md:inline">Local + Auto-Save</span>
                    </>
                  )}
                </button>

                {/* Live Alerts Button */}
                <button
                  onClick={() => setActiveTab('orders')}
                  className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a] transition-all cursor-pointer"
                  title="View live orders and reservations"
                >
                  <Bell className="w-4 h-4 text-[#e8281a]" />
                  <span className="hidden sm:inline">Live Activity</span>
                  {totalAlerts > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#e8281a] text-white">
                      {totalAlerts}
                    </span>
                  )}
                </button>

                {/* Reset Defaults Button */}
                <button
                  onClick={() => setConfirmResetOpen(true)}
                  className="p-2.5 rounded-xl bg-[#fff8f0] hover:bg-red-50 text-[#7a6e65] hover:text-[#e8281a] border border-[#e0d6c8] transition-all cursor-pointer"
                  title="Restore Default Template Data"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Back to Website */}
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Live Website</span>
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
              <div className="max-w-[1440px] mx-auto pb-12">
                {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
                {activeTab === 'orders' && <AdminOrders showToast={showToast} />}
                {activeTab === 'stock' && <AdminStock />}
                {activeTab === 'categories' && <AdminCategories showToast={showToast} />}
                {activeTab === 'items' && <AdminMenuItems showToast={showToast} />}
                {activeTab === 'variants' && <AdminVariantsAddons />}
                {activeTab === 'content' && <AdminSectionContent showToast={showToast} />}
                {activeTab === 'gallery' && <AdminGallery />}
                {activeTab === 'sections' && <AdminSections showToast={showToast} />}
                {activeTab === 'info' && <AdminRestaurantInfo />}
                {activeTab === 'branding' && <AdminBranding />}
                {activeTab === 'ordersettings' && <AdminOrderSettings />}
                {activeTab === 'socials' && <AdminSocials />}
                {activeTab === 'seo' && <AdminSEO />}
                {activeTab === 'chatbot' && <AdminChatbot showToast={showToast} />}
                {activeTab === 'database' && <AdminDatabaseSetup />}
                {activeTab === 'backup' && <AdminBackupExport />}
                {activeTab === 'help' && <AdminHelpGuide />}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
