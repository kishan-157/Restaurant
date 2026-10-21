import React from 'react';
import {
  LayoutDashboard,
  Palette,
  Layers,
  FolderTree,
  Utensils,
  ListPlus,
  PackageCheck,
  Truck,
  Store,
  Images,
  Share2,
  Search,
  Database,
  Eye,
  DownloadCloud,
  HelpCircle,
  X,
  Radio,
  Server,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export type AdminTab =
  | 'dashboard'
  | 'branding'
  | 'sections'
  | 'categories'
  | 'items'
  | 'variants'
  | 'stock'
  | 'order-settings'
  | 'restaurant-info'
  | 'gallery'
  | 'socials'
  | 'seo'
  | 'database-setup'
  | 'preview'
  | 'backup'
  | 'help';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onSelectTab, onClose }) => {
  const { data, isConnected } = useRestaurant();

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: '1. Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'branding', label: '2. Website Branding', icon: <Palette className="w-4 h-4" /> },
    { id: 'sections', label: '3. Website Sections', icon: <Layers className="w-4 h-4" /> },
    { id: 'categories', label: '4. Menu Categories', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'items', label: '5. Menu Items', icon: <Utensils className="w-4 h-4" /> },
    { id: 'variants', label: '6. Variants & Add-ons', icon: <ListPlus className="w-4 h-4" /> },
    { id: 'stock', label: '7. Stock & Availability', icon: <PackageCheck className="w-4 h-4" /> },
    { id: 'order-settings', label: '8. Order Settings', icon: <Truck className="w-4 h-4" /> },
    { id: 'restaurant-info', label: '9. Restaurant Info', icon: <Store className="w-4 h-4" /> },
    { id: 'gallery', label: '10. Gallery & Images', icon: <Images className="w-4 h-4" /> },
    { id: 'socials', label: '11. Social & Platforms', icon: <Share2 className="w-4 h-4" /> },
    { id: 'seo', label: '12. SEO Settings', icon: <Search className="w-4 h-4" /> },
    {
      id: 'database-setup',
      label: '13. Database Setup',
      icon: <Database className="w-4 h-4" />,
      badge: isConnected ? 'Connected' : 'Setup',
    },
    { id: 'preview', label: '14. Preview Website', icon: <Eye className="w-4 h-4" /> },
    { id: 'backup', label: '15. Backup & Export', icon: <DownloadCloud className="w-4 h-4" /> },
    { id: 'help', label: '16. Setup Guide & Docs', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-stone-900 text-stone-200 flex flex-col h-full border-r border-stone-800 shrink-0">
      {/* Brand & Connection Mode Banner */}
      <div className="p-4 border-b border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-heading tracking-wide">
              {data.profile.name}
            </h2>
            <p className="text-[11px] text-stone-400">Master Admin Panel</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            title="Exit Admin Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Mode Indicator */}
        <div
          className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
            isConnected
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
              : 'bg-amber-950/60 border-amber-700/60 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-semibold">
              {isConnected ? 'Supabase Live' : 'Demo / Local Mode'}
            </span>
          </div>
          <span className="text-[10px] opacity-75">
            {isConnected ? 'Sync Active' : 'Browser Storage'}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={isActive ? 'text-white' : 'text-stone-400'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                    item.badge === 'Connected'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-stone-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Exit Button */}
      <div className="p-3 border-t border-stone-800">
        <button
          onClick={onClose}
          className="w-full py-2 px-3 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Return to Website</span>
        </button>
      </div>
    </aside>
  );
};
