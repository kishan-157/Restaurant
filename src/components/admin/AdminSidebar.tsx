import React from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  UtensilsCrossed,
  FolderTree,
  Store,
  Palette,
  FileEdit,
  Images,
  SlidersHorizontal,
  Database,
  LogOut,
  ExternalLink,
  X,
  Flame,
  Layers,
  PackageCheck,
  Settings2,
  Share2,
  Search,
  HardDriveDownload,
  HelpCircle,
  Bot,
  Volume2,
  Mic,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export type AdminTabId =
  | 'dashboard'
  | 'orders'
  | 'categories'
  | 'items'
  | 'variants'
  | 'stock'
  | 'content'
  | 'gallery'
  | 'sections'
  | 'info'
  | 'branding'
  | 'ordersettings'
  | 'socials'
  | 'seo'
  | 'chatbot'
  | 'voiceassistant'
  | 'audio'
  | 'database'
  | 'backup'
  | 'help';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  onCloseAdmin: () => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onCloseAdmin,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { data, orders, reservations, contactMessages } = useRestaurant();

  const pendingOrdersCount = orders.filter(
    o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  ).length;
  const pendingReservationsCount = reservations.filter(r => r.status === 'pending').length;
  const unreadMessagesCount = contactMessages.filter(m => !m.isRead).length;
  const totalLiveBadge = pendingOrdersCount + pendingReservationsCount + unreadMessagesCount;

  const navGroups: {
    title: string;
    items: { id: AdminTabId; label: string; icon: React.ElementType; badge?: number }[];
  }[] = [
    {
      title: 'Live Operations',
      items: [
        { id: 'dashboard', label: 'Live Overview', icon: LayoutGrid },
        {
          id: 'orders',
          label: 'Orders & Bookings',
          icon: ShoppingBag,
          badge: totalLiveBadge > 0 ? totalLiveBadge : undefined,
        },
        { id: 'stock', label: 'Quick Stock Toggle', icon: PackageCheck },
        { id: 'chatbot', label: 'Smart Chatbot', icon: Bot },
        { id: 'voiceassistant', label: 'AI Voice Waiter', icon: Mic },
        { id: 'audio', label: 'Welcome Audio & Voice', icon: Volume2 },
      ],
    },
    {
      title: 'Menu Management',
      items: [
        {
          id: 'categories',
          label: 'Menu Categories',
          icon: FolderTree,
          badge: data.categories.length,
        },
        {
          id: 'items',
          label: 'Dishes & Pricing',
          icon: UtensilsCrossed,
          badge: data.items.length,
        },
        { id: 'variants', label: 'Sizes & Add-ons', icon: Layers },
      ],
    },
    {
      title: 'Website Customization',
      items: [
        { id: 'content', label: 'All Page Content', icon: FileEdit },
        { id: 'gallery', label: 'Photo Gallery', icon: Images, badge: data.gallery.length },
        { id: 'info', label: 'Restaurant & Hours', icon: Store },
        { id: 'branding', label: 'Theme & Colors', icon: Palette },
        { id: 'ordersettings', label: 'Order & WhatsApp', icon: Settings2 },
        { id: 'sections', label: 'Section Visibility', icon: SlidersHorizontal },
        { id: 'socials', label: 'Social Media Links', icon: Share2 },
        { id: 'seo', label: 'SEO & Meta Tags', icon: Search },
      ],
    },
    {
      title: 'Cloud & System',
      items: [
        { id: 'database', label: 'Supabase Realtime', icon: Database },
        { id: 'backup', label: 'Backup & Export', icon: HardDriveDownload },
        { id: 'help', label: 'Setup Guide', icon: HelpCircle },
      ],
    },
  ];

  const handleSelect = (id: AdminTabId) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[268px] bg-[#1a1a1a] text-white flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 border-r border-white/10 select-none ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
            style={{ backgroundColor: data.profile.primaryColor || '#e8281a' }}
          >
            <Flame className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span
              className="font-black text-xl tracking-tight text-white block leading-none truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {data.profile.name || 'Sarab'}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#f6a623] mt-1 block">
              Admin Studio
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map(group => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              {group.title}
            </div>
            <nav className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#e8281a] text-white font-semibold shadow-lg shadow-[#e8281a]/25'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-white/50'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive
                            ? 'bg-white text-[#e8281a]'
                            : item.id === 'orders'
                            ? 'bg-[#f6a623] text-[#1a1a1a]'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-2 bg-[#141414]">
        <button
          onClick={onCloseAdmin}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#f6a623]" />
          <span>View Live Website</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock Admin Panel</span>
        </button>
      </div>
    </aside>
  );
};
