import React from 'react';
import {
  Store,
  FolderTree,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  Database,
  Truck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { AdminTab } from '../AdminSidebar';

interface AdminDashboardProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { data, isConnected, supabaseConfig } = useRestaurant();
  const { profile, categories, items, orderSettings } = data;

  // Real Metrics
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const totalItems = items.length;
  const unavailableItems = items.filter((i) => i.stockStatus !== 'available').length;
  const bestsellersCount = items.filter((i) => i.isBestseller).length;

  // Incomplete Setup Warnings
  const warnings: { text: string; tab: AdminTab; action: string }[] = [];

  if (!profile.whatsappNumber || profile.whatsappNumber === '919820012345') {
    warnings.push({
      text: 'Default sample WhatsApp number is still active. Update to your client\'s real business phone.',
      tab: 'restaurant-info',
      action: 'Change Phone',
    });
  }

  if (!isConnected) {
    warnings.push({
      text: 'Running in Local Demo Mode. Multi-device persistence requires connecting a Supabase project.',
      tab: 'database-setup',
      action: 'Setup Database',
    });
  }

  if (unavailableItems > 0) {
    warnings.push({
      text: `${unavailableItems} menu ${unavailableItems === 1 ? 'item is' : 'items are'} currently marked Sold Out or Unavailable.`,
      tab: 'stock',
      action: 'Check Stock',
    });
  }

  if (orderSettings.temporarilyPauseOrders) {
    warnings.push({
      text: 'Online ordering is currently PAUSED for diners.',
      tab: 'order-settings',
      action: 'Resume Orders',
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900">Restaurant Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real configuration status and inventory metrics for {profile.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('preview')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-xs"
          >
            Live Website Preview
          </button>
        </div>
      </div>

      {/* Setup Warnings Banner if any */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Setup & Readiness Checklist</span>
          </h3>
          <div className="space-y-2">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900"
              >
                <span>{w.text}</span>
                <button
                  onClick={() => onNavigate(w.tab)}
                  className="font-bold underline hover:text-amber-700 whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <span>{w.action}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Categories Card */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
            <FolderTree className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-neutral-900">{totalCategories}</span>
            <span className="text-xs text-neutral-500">({activeCategories} active)</span>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1 block"
          >
            Manage Categories →
          </button>
        </div>

        {/* Menu Items Card */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Menu Dishes</span>
            <Utensils className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-neutral-900">{totalItems}</span>
            <span className="text-xs text-neutral-500">({bestsellersCount} bestsellers)</span>
          </div>
          <button
            onClick={() => onNavigate('items')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1 block"
          >
            Manage Menu Dishes →
          </button>
        </div>

        {/* Stock Status Card */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Kitchen Availability</span>
            <AlertTriangle className={`w-4 h-4 ${unavailableItems > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-neutral-900">
              {totalItems - unavailableItems}
            </span>
            <span className="text-xs text-neutral-500">/ {totalItems} available</span>
          </div>
          <button
            onClick={() => onNavigate('stock')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1 block"
          >
            Quick Stock Toggles →
          </button>
        </div>

        {/* Database Mode Card */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Database Connection</span>
            <Database className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-bold ${isConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isConnected ? 'Supabase Connected' : 'Local Storage Demo'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('database-setup')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1 block"
          >
            Connection Wizard →
          </button>
        </div>
      </div>

      {/* Fulfillment Status Matrix */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-700" />
          <span>Ordering & Delivery Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-xl space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span>Home Delivery</span>
              <span className={orderSettings.acceptHomeDelivery ? 'text-emerald-700' : 'text-neutral-400'}>
                {orderSettings.acceptHomeDelivery ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-neutral-500">Fee: {profile.currencySymbol}{orderSettings.deliveryFee} · Free at {profile.currencySymbol}{orderSettings.freeDeliveryThreshold}</p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span>Takeaway / Pickup</span>
              <span className={orderSettings.acceptTakeaway ? 'text-emerald-700' : 'text-neutral-400'}>
                {orderSettings.acceptTakeaway ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-neutral-500">Prep time: ~{orderSettings.estimatedPickupTime}</p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span>WhatsApp Direct Checkout</span>
              <span className={orderSettings.enableWhatsAppOrdering ? 'text-emerald-700' : 'text-neutral-400'}>
                {orderSettings.enableWhatsAppOrdering ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="text-neutral-500">Number: +{profile.whatsappNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
