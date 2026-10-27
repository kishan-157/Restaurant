import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  UtensilsCrossed,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Flame,
  FileEdit,
  Database,
  Phone,
  Users,
  Sparkles,
  Palette,
  Store,
  Upload,
  Trash2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { AdminTabId } from '../AdminSidebar';
import { OrderStatus } from '../../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTabId) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const {
    data,
    orders,
    reservations,
    contactMessages,
    updateOrderStatus,
    updateReservationStatus,
    updateProfile,
    isConnected,
  } = useRestaurant();

  const [brandName, setBrandName] = useState(data.profile.name || 'Sarab');
  const [brandTagline, setBrandTagline] = useState(data.profile.tagline || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(data.profile.logoUrl || '');
  const [brandSaved, setBrandSaved] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBrandName(data.profile.name || 'Sarab');
    setBrandTagline(data.profile.tagline || '');
    setBrandLogoUrl(data.profile.logoUrl || '');
  }, [data.profile.name, data.profile.tagline, data.profile.logoUrl]);

  const handleQuickLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.92);
          setBrandLogoUrl(dataUrl);
          updateProfile({
            name: brandName.trim() || data.profile.name,
            tagline: brandTagline,
            logoUrl: dataUrl,
          });
          setBrandSaved(true);
          setTimeout(() => setBrandSaved(false), 2500);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickBrandSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: brandName.trim() || 'Sarab',
      tagline: brandTagline,
      logoUrl: brandLogoUrl,
    });
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2500);
  };

  const currency = data.profile.currencySymbol || '₹';

  // 100% Real-Time Metrics from Live State (Zero Fake Data)
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const activeKitchenOrders = orders.filter(
    o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );
  const whatsappOrdersCount = orders.filter(o => o.channel === 'whatsapp').length;
  const directOrdersCount = orders.filter(o => o.channel === 'admin').length;

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const unreadMessages = contactMessages.filter(m => !m.isRead);

  const availableItemsCount = data.items.filter(i => i.stockStatus === 'available').length;
  const totalItemsCount = data.items.length;
  const activeCategoriesCount = data.categories.filter(c => c.isActive).length;

  // Category dish distribution (computed from real menu categories and items)
  const categoryStats = data.categories.map(cat => {
    const itemsInCat = data.items.filter(i => i.categoryId === cat.id);
    const availableInCat = itemsInCat.filter(i => i.stockStatus === 'available').length;
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.iconName || '🍽️',
      count: itemsInCat.length,
      available: availableInCat,
      percentage: totalItemsCount > 0 ? Math.round((itemsInCat.length / totalItemsCount) * 100) : 0,
    };
  });

  const statusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-[#f6a623]/20 text-[#9a6200] border-[#f6a623]/40';
      case 'preparing':
        return 'bg-[#e8281a]/10 text-[#e8281a] border-[#e8281a]/30';
      case 'ready':
      case 'delivered':
        return 'bg-[#2d6a4f]/15 text-[#2d6a4f] border-[#2d6a4f]/30';
      case 'cancelled':
        return 'bg-neutral-200 text-neutral-600 border-neutral-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Real-Time Status Banner */}
      <div className="bg-[#1a1a1a] text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f6a623] text-[11px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Real-Time Restaurant Control Center</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome to {data.profile.name} Admin Studio
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-2 leading-relaxed">
            Every metric below reflects your live store activity. Customize any section of the website, update dish prices, or manage incoming orders and table reservations in real time.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('info')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f6a623] hover:bg-[#e09416] text-[#1a1a1a] text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Name, Logo & Hours</span>
          </button>
          <button
            onClick={() => onNavigateTab('content')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-semibold transition-all shadow-lg shadow-[#e8281a]/30 cursor-pointer"
          >
            <FileEdit className="w-4 h-4" />
            <span>Customize Website Content</span>
          </button>
          <button
            onClick={() => onNavigateTab('items')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/10 cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4 text-[#f6a623]" />
            <span>Manage Menu ({totalItemsCount})</span>
          </button>
        </div>
      </div>

      {/* ===================== INSTANT RESTAURANT NAME & LOGO EDITOR (ON HOME SCREEN) ===================== */}
      <form
        onSubmit={handleQuickBrandSave}
        className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#e8281a]/30 shadow-md space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e8dc] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1a1a1a]">
                Restaurant Name & Brand Logo Change Karein
              </h3>
              <p className="text-[11px] text-[#7a6e65]">
                Yahan se seedha apne Restaurant ka Naam, Tagline aur Logo photo upload ya change karein
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            {brandSaved && <Check className="w-4 h-4" />}
            <span>{brandSaved ? 'Name & Logo Saved!' : 'Save Name & Logo'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Logo Preview + Upload */}
          <div className="lg:col-span-5 flex items-center gap-4 p-3.5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white border border-[#e0d6c8] flex items-center justify-center shrink-0 shadow-xs">
              {brandLogoUrl && brandLogoUrl.trim() ? (
                <img
                  src={brandLogoUrl}
                  alt={brandName}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${data.profile.primaryColor || '#e8281a'}, ${
                      data.profile.secondaryColor || '#f6a623'
                    })`,
                  }}
                >
                  <Flame className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1a1a1a]">Restaurant Logo Image</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo File</span>
                </button>
                {brandLogoUrl && brandLogoUrl.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrandLogoUrl('');
                      updateProfile({ logoUrl: '' });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={brandLogoUrl.startsWith('data:') ? '' : brandLogoUrl}
                onChange={(e) => setBrandLogoUrl(e.target.value)}
                placeholder={
                  brandLogoUrl.startsWith('data:')
                    ? 'Uploaded file active (or paste image URL here)'
                    : 'Or paste direct Logo Image URL...'
                }
                className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-[#e0d6c8] rounded-lg focus:outline-none focus:border-[#e8281a]"
              />
            </div>
          </div>

          {/* Restaurant Name & Tagline Inputs */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1a1a1a] mb-1.5">
                Restaurant Name <span className="text-[#e8281a]">*</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter your restaurant name..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm font-bold text-[#1a1a1a] focus:outline-none focus:border-[#e8281a]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1a1a] mb-1.5">
                Tagline / Subtitle (Below Name)
              </label>
              <input
                type="text"
                value={brandTagline}
                onChange={(e) => setBrandTagline(e.target.value)}
                placeholder="e.g. Fast Food & Family Dining"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e8281a]"
              />
            </div>
          </div>
        </div>
      </form>

      {/* 4 Real-Time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Real-Time Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e65]">
              Live Order Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#2d6a4f]/10 text-[#2d6a4f] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className="text-3xl font-black text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currency}
              {totalRevenue.toFixed(2)}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0e8dc] text-xs text-[#7a6e65]">
              <span>From {validOrders.length} valid orders</span>
              <span className="font-semibold text-[#2d6a4f]">{deliveredOrders} completed</span>
            </div>
          </div>
        </div>

        {/* Card 2: Live Kitchen Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#e8281a] transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e65]">
              Live Food Orders
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center group-hover:bg-[#e8281a] group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className="text-3xl font-black text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {orders.length}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0e8dc] text-xs text-[#7a6e65]">
              <span>
                <strong className="text-[#e8281a]">{activeKitchenOrders.length}</strong> active now
              </span>
              <span>
                WA: {whatsappOrdersCount} • Direct: {directOrdersCount}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Table Reservations & Inquiries */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#f6a623] transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e65]">
              Table Bookings & Messages
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#f6a623]/15 text-[#9a6200] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className="text-3xl font-black text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {reservations.length}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0e8dc] text-xs text-[#7a6e65]">
              <span>
                <strong className="text-[#9a6200]">{pendingReservations.length}</strong> pending tables
              </span>
              <span>{unreadMessages.length} messages</span>
            </div>
          </div>
        </div>

        {/* Card 4: Live Menu Dishes */}
        <div
          onClick={() => onNavigateTab('items')}
          className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#2d6a4f] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e65]">
              Active Menu Dishes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a]/5 text-[#1a1a1a] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className="text-3xl font-black text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {availableItemsCount}{' '}
              <span className="text-base font-medium text-[#7a6e65]">/ {totalItemsCount}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0e8dc] text-xs text-[#7a6e65]">
              <span>Across {activeCategoriesCount} categories</span>
              <span className="font-semibold text-[#e8281a]">
                {data.offers.filter(o => o.isActive).length} active promos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Live Orders & Reservations + Menu Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Live Orders & Table Reservations Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Incoming Orders Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3
                  className="text-lg font-bold text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Recent Live Orders
                </h3>
                <p className="text-xs text-[#7a6e65]">
                  Real-time orders placed by customers from your website checkout
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e8281a] hover:underline cursor-pointer"
              >
                <span>View All ({orders.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl bg-[#fff8f0] border border-dashed border-[#e0d6c8] p-8 text-center">
                <ShoppingBag className="w-8 h-8 text-[#7a6e65] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#1a1a1a]">No Customer Orders Yet</p>
                <p className="text-xs text-[#7a6e65] mt-1 max-w-md mx-auto">
                  Zero fake orders are shown. As soon as a customer places an order via WhatsApp or Direct Checkout on the website, it will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1a1a1a]">{order.orderNumber}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeStyle(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span className="text-[11px] font-medium text-[#7a6e65] capitalize">
                          • {order.orderType}
                        </span>
                      </div>
                      <p className="text-xs text-[#5a524c] mt-1">
                        <strong>{order.customerName}</strong> ({order.customerPhone}) —{' '}
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-[#1a1a1a] mr-2">
                        {currency}
                        {Number(order.total).toFixed(2)}
                      </span>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold hover:bg-[#c01f12] transition-all cursor-pointer"
                        >
                          Accept & Prepare
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#23533d] transition-all cursor-pointer"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Table Reservations Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3
                  className="text-lg font-bold text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Recent Table Reservations
                </h3>
                <p className="text-xs text-[#7a6e65]">
                  Live bookings submitted from the website reservation form
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e8281a] hover:underline cursor-pointer"
              >
                <span>Manage Bookings ({reservations.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reservations.length === 0 ? (
              <div className="rounded-2xl bg-[#fff8f0] border border-dashed border-[#e0d6c8] p-8 text-center">
                <CalendarCheck className="w-8 h-8 text-[#7a6e65] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#1a1a1a]">No Table Reservations Yet</p>
                <p className="text-xs text-[#7a6e65] mt-1 max-w-md mx-auto">
                  When guests reserve a table on your website, their booking details will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.slice(0, 4).map(res => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1a1a1a]">{res.guestName}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            res.status === 'confirmed'
                              ? 'bg-[#2d6a4f]/15 text-[#2d6a4f]'
                              : res.status === 'cancelled'
                              ? 'bg-neutral-200 text-neutral-600'
                              : 'bg-[#f6a623]/20 text-[#9a6200]'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#7a6e65] mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#e8281a]" />
                          {res.reservationDate} at {res.reservationTime}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#2d6a4f]" />
                          {res.partySize}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {res.guestPhone}
                        </span>
                      </div>
                    </div>

                    {res.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateReservationStatus(res.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#23533d] transition-all cursor-pointer"
                        >
                          Confirm Table
                        </button>
                        <button
                          onClick={() => updateReservationStatus(res.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-xl bg-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-300 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Menu Distribution & Quick Customization Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Menu Category Distribution */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className="text-lg font-bold text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Menu Categories Breakdown
                </h3>
                <p className="text-xs text-[#7a6e65]">
                  Live dish count and stock status per category
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('categories')}
                className="text-xs font-bold text-[#e8281a] hover:underline cursor-pointer"
              >
                Edit Categories
              </button>
            </div>

            <div className="space-y-3.5">
              {categoryStats.map(cat => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1a1a1a] flex items-center gap-2">
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[#7a6e65]">
                      <strong className="text-[#1a1a1a]">{cat.available}</strong> / {cat.count} in stock
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#fff8f0] overflow-hidden border border-[#e0d6c8]/60">
                    <div
                      className="h-full rounded-full bg-[#e8281a] transition-all duration-300"
                      style={{ width: `${Math.max(cat.percentage, 6)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Website Customization Shortcuts */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8]/80 shadow-sm">
            <h3
              className="text-lg font-bold text-[#1a1a1a] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Website Customization Studio
            </h3>
            <p className="text-xs text-[#7a6e65] mb-4">
              Every part of the Sarab website is 100% customizable and syncs with Supabase:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigateTab('content')}
                className="p-3.5 rounded-2xl bg-[#fff8f0] hover:bg-[#f3e9dc] border border-[#e0d6c8]/80 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#1a1a1a]">Hero, Chefs & Timeline</div>
                  <div className="text-[11px] text-[#7a6e65]">Banners, deals & stories</div>
                </div>
                <Flame className="w-4 h-4 text-[#e8281a] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('items')}
                className="p-3.5 rounded-2xl bg-[#fff8f0] hover:bg-[#f3e9dc] border border-[#e0d6c8]/80 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#1a1a1a]">Menu Dishes & Prices</div>
                  <div className="text-[11px] text-[#7a6e65]">{totalItemsCount} customizable items</div>
                </div>
                <UtensilsCrossed className="w-4 h-4 text-[#e8281a] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('branding')}
                className="p-3.5 rounded-2xl bg-[#fff8f0] hover:bg-[#f3e9dc] border border-[#e0d6c8]/80 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#1a1a1a]">Theme Colors & Fonts</div>
                  <div className="text-[11px] text-[#7a6e65]">Customize brand palette</div>
                </div>
                <Palette className="w-4 h-4 text-[#f6a623] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTab('database')}
                className="p-3.5 rounded-2xl bg-[#fff8f0] hover:bg-[#f3e9dc] border border-[#e0d6c8]/80 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#1a1a1a]">Supabase Cloud Sync</div>
                  <div className="text-[11px] text-[#7a6e65]">
                    {isConnected ? 'Connected & Live' : 'Configure SQL Sync'}
                  </div>
                </div>
                <Database className="w-4 h-4 text-[#2d6a4f] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
