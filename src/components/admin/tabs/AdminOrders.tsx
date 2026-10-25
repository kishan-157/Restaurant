import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  LayoutDashboard,
  Clock,
  Phone,
  MapPin,
  Search,
  Trash2,
  CheckCircle2,
  ChefHat,
  Truck,
  XCircle,
  CalendarCheck,
  Mail,
  Users,
  Sparkles,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { OrderStatus } from '../../../types';
import { formatISTDateTime } from '../../../utils/indianTime';

interface AdminOrdersProps {
  showToast?: (msg: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ showToast }) => {
  const {
    data,
    orders,
    reservations,
    contactMessages,
    updateOrderStatus,
    deleteOrder,
    updateReservationStatus,
    deleteReservation,
    deleteContactMessage,
    updateOrderSettings,
  } = useRestaurant();

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'reservations' | 'messages'>('orders');
  const [filterChannel, setFilterChannel] = useState<'all' | 'admin' | 'whatsapp'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toast = (msg: string) => {
    if (showToast) showToast(msg);
  };

  const whatsappEnabled = data.orderSettings.enableWhatsAppOrdering;
  const adminPanelEnabled = data.orderSettings.enableAdminPanelOrdering;

  const handleToggleChannel = (key: 'enableWhatsAppOrdering' | 'enableAdminPanelOrdering') => {
    const nextWhatsapp = key === 'enableWhatsAppOrdering' ? !whatsappEnabled : whatsappEnabled;
    const nextAdmin = key === 'enableAdminPanelOrdering' ? !adminPanelEnabled : adminPanelEnabled;

    if (!nextWhatsapp && !nextAdmin) {
      toast('At least one ordering option (WhatsApp or Direct Admin) must stay enabled.');
      return;
    }

    updateOrderSettings({
      [key]: !data.orderSettings[key],
    });
    toast('Checkout ordering channels updated & synced!');
  };

  const filteredOrders = orders.filter(order => {
    if (filterChannel !== 'all' && order.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    toast(`Order status updated to ${status.toUpperCase()}`);
  };

  const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-300',
    preparing: 'bg-[#e8281a]/10 text-[#e8281a] border-[#e8281a]/30',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    delivered: 'bg-[#2d6a4f]/15 text-[#2d6a4f] border-[#2d6a4f]/30',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs: Food Orders | Table Reservations | Contact & Catering Inquiries */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#e0d6c8]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-[#e8281a] text-white shadow-sm'
                : 'text-[#5a524c] hover:bg-[#fff8f0]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Food Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reservations')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'reservations'
                ? 'bg-[#e8281a] text-white shadow-sm'
                : 'text-[#5a524c] hover:bg-[#fff8f0]'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Table Reservations ({reservations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('messages')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'messages'
                ? 'bg-[#e8281a] text-white shadow-sm'
                : 'text-[#5a524c] hover:bg-[#fff8f0]'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>
              Customer Messages & Catering ({contactMessages.length + (data.partyInquiries?.length || 0)})
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'orders' && (
        <>
          {/* Dual Order Channel Switcher Card */}
          <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 shadow-xs">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#e8281a]">
                Live Checkout Routing
              </span>
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Order Reception Channels (WhatsApp & Direct Admin)
              </h3>
              <p className="text-xs text-[#7a6e65] mt-0.5">
                Choose how customers can submit orders on your website. All orders automatically save in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: WhatsApp Order Toggle */}
              <div
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  whatsappEnabled
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-[#fff8f0] border-[#e0d6c8] opacity-75'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      whatsappEnabled
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#1a1a1a] text-sm">Order on WhatsApp</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          whatsappEnabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {whatsappEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7a6e65] mt-1">
                      Sends formatted bill to your WhatsApp ({data.profile.whatsappNumber}) AND logs the order here.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleChannel('enableWhatsAppOrdering')}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    whatsappEnabled ? 'bg-emerald-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      whatsappEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Option 2: Direct to Admin Panel Toggle */}
              <div
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  adminPanelEnabled
                    ? 'bg-[#e8281a]/5 border-[#e8281a]/40'
                    : 'bg-[#fff8f0] border-[#e0d6c8] opacity-75'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      adminPanelEnabled
                        ? 'bg-[#e8281a] text-white shadow-sm'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#1a1a1a] text-sm">Direct Admin Panel Order</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          adminPanelEnabled
                            ? 'bg-[#e8281a]/15 text-[#e8281a]'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {adminPanelEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7a6e65] mt-1">
                      Customers place orders directly on the website without needing WhatsApp open.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleChannel('enableAdminPanelOrdering')}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    adminPanelEnabled ? 'bg-[#e8281a]' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      adminPanelEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="bg-white border border-[#e0d6c8] rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7a6e65] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Order #, Customer Name, or Phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#fff8f0] border border-[#e0d6c8] rounded-xl text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e8281a]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterChannel}
                onChange={e => setFilterChannel(e.target.value as 'all' | 'admin' | 'whatsapp')}
                className="px-3.5 py-2.5 bg-[#fff8f0] border border-[#e0d6c8] rounded-xl text-xs font-semibold text-[#1a1a1a]"
              >
                <option value="all">All Channels</option>
                <option value="admin">Direct Admin Panel</option>
                <option value="whatsapp">WhatsApp Orders</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3.5 py-2.5 bg-[#fff8f0] border border-[#e0d6c8] rounded-xl text-xs font-semibold text-[#1a1a1a]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-[#e0d6c8] rounded-3xl p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-[#7a6e65] mx-auto mb-3 opacity-50" />
              <h4
                className="text-lg font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                No Live Orders Matching Filter
              </h4>
              <p className="text-xs text-[#7a6e65] max-w-md mx-auto mt-1">
                Orders placed by customers from your website cart will appear here automatically in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white border border-[#e0d6c8] rounded-3xl p-5 shadow-xs transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#f0e8dc]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-black text-base text-[#1a1a1a]">{order.orderNumber}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                          statusColors[order.status] || statusColors.pending
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          order.channel === 'whatsapp'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#fff8f0] text-[#1a1a1a] border border-[#e0d6c8]'
                        }`}
                      >
                        {order.channel === 'whatsapp' ? (
                          <>
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp Order
                          </>
                        ) : (
                          <>
                            <LayoutDashboard className="w-3.5 h-3.5 text-[#e8281a]" />
                            Admin Direct
                          </>
                        )}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#fff8f0] text-[#5a524c] capitalize">
                        {order.orderType}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#7a6e65]">
                        <Clock className="w-3.5 h-3.5" />
                        {formatISTDateTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        disabled={order.status === 'preparing'}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f6a623]/20 hover:bg-[#f6a623]/30 text-[#9a6200] disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        Preparing
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        disabled={order.status === 'ready'}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ready
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        disabled={order.status === 'delivered'}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2d6a4f] hover:bg-[#23533d] text-white disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Delivered
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                        disabled={order.status === 'cancelled'}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          deleteOrder(order.id);
                          toast('Order deleted.');
                        }}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2 text-xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#7a6e65]">
                        Customer Details
                      </div>
                      <div className="font-bold text-[#1a1a1a] text-sm">{order.customerName}</div>
                      <div className="flex items-center gap-2 text-[#5a524c]">
                        <Phone className="w-3.5 h-3.5 text-[#7a6e65]" />
                        <a href={`tel:${order.customerPhone}`} className="hover:underline">
                          {order.customerPhone}
                        </a>
                      </div>
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2 text-[#5a524c]">
                          <MapPin className="w-3.5 h-3.5 text-[#7a6e65] shrink-0 mt-0.5" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                      )}
                      {order.specialInstructions && (
                        <div className="p-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#5a524c]">
                          <span className="font-semibold">Instructions:</span> {order.specialInstructions}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 flex flex-col justify-between bg-[#fff8f0] rounded-2xl p-4 border border-[#e0d6c8]/70">
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#7a6e65]">
                          Ordered Dishes ({order.items.reduce((s, i) => s + i.quantity, 0)})
                        </div>
                        <div className="divide-y divide-[#e0d6c8]/60">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-[#1a1a1a]">{item.quantity}x </span>
                                <span className="font-medium text-[#1a1a1a]">{item.name}</span>
                                {item.variantName && (
                                  <span className="text-[#7a6e65]"> ({item.variantName})</span>
                                )}
                                {item.addonNames && item.addonNames.length > 0 && (
                                  <span className="text-[#7a6e65] block text-[11px]">
                                    + {item.addonNames.join(', ')}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-[#1a1a1a]">
                                {data.profile.currencySymbol}
                                {Number(item.lineTotal).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#e0d6c8] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[#7a6e65] space-x-3">
                          <span>
                            Subtotal: {data.profile.currencySymbol}
                            {Number(order.subtotal).toFixed(2)}
                          </span>
                          {order.deliveryFee > 0 && (
                            <span>
                              Delivery: {data.profile.currencySymbol}
                              {Number(order.deliveryFee).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black text-[#1a1a1a]">
                          Total: {data.profile.currencySymbol}
                          {Number(order.total).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeSubTab === 'reservations' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6">
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Live Table Reservations ({reservations.length})
            </h3>
            <p className="text-xs text-[#7a6e65] mt-1">
              Bookings submitted by guests from the "Book A Table" section on the website.
            </p>
          </div>

          {reservations.length === 0 ? (
            <div className="bg-white border border-[#e0d6c8] rounded-3xl p-12 text-center">
              <CalendarCheck className="w-12 h-12 text-[#7a6e65] mx-auto mb-3 opacity-50" />
              <h4
                className="text-lg font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                No Table Reservations Yet
              </h4>
              <p className="text-xs text-[#7a6e65] max-w-md mx-auto mt-1">
                When a guest submits the table reservation form on your website, it will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.map(res => (
                <div
                  key={res.id}
                  className="bg-white border border-[#e0d6c8] rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-base text-[#1a1a1a]">{res.guestName}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          res.status === 'confirmed'
                            ? 'bg-[#2d6a4f]/15 text-[#2d6a4f]'
                            : res.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-[#f6a623]/20 text-[#9a6200]'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#5a524c]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#e8281a]" />
                        <strong>{res.reservationDate}</strong> at <strong>{res.reservationTime}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#2d6a4f]" />
                        <span>{res.partySize}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#7a6e65]" />
                        <a href={`tel:${res.guestPhone}`} className="hover:underline">
                          {res.guestPhone}
                        </a>
                        {res.guestEmail && <span>• {res.guestEmail}</span>}
                      </div>
                      {res.specialRequest && (
                        <div className="p-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] mt-2">
                          <span className="font-semibold">Special Request:</span> {res.specialRequest}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#f0e8dc]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          updateReservationStatus(res.id, 'confirmed');
                          toast('Reservation confirmed!');
                        }}
                        disabled={res.status === 'confirmed'}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          updateReservationStatus(res.id, 'cancelled');
                          toast('Reservation cancelled.');
                        }}
                        disabled={res.status === 'cancelled'}
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        deleteReservation(res.id);
                        toast('Reservation removed.');
                      }}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'messages' && (
        <div className="space-y-6">
          {/* Contact Messages */}
          <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-4">
            <div>
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Website Contact Messages ({contactMessages.length})
              </h3>
              <p className="text-xs text-[#7a6e65]">
                Direct messages submitted from the "Send Us A Message" form in the Location & Contact section.
              </p>
            </div>

            {contactMessages.length === 0 ? (
              <div className="rounded-2xl bg-[#fff8f0] border border-dashed border-[#e0d6c8] p-8 text-center text-xs text-[#7a6e65]">
                No contact messages received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {contactMessages.map(msg => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1a1a1a]">{msg.name}</span>
                        {msg.subject && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#e8281a]/10 text-[#e8281a]">
                            {msg.subject}
                          </span>
                        )}
                        <span className="text-xs text-[#7a6e65]">
                          • {formatISTDateTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-[#5a524c] mt-0.5">Email: {msg.email}</div>
                      <p className="text-xs text-[#1a1a1a] mt-2 bg-white p-3 rounded-xl border border-[#e0d6c8]/60">
                        {msg.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          deleteContactMessage(msg.id);
                          toast('Message deleted.');
                        }}
                        className="p-2 rounded-xl text-neutral-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Party & Catering Inquiries */}
          <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f6a623]" />
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Party & Event Catering Inquiries ({data.partyInquiries?.length || 0})
              </h3>
            </div>
            {!data.partyInquiries || data.partyInquiries.length === 0 ? (
              <div className="rounded-2xl bg-[#fff8f0] border border-dashed border-[#e0d6c8] p-8 text-center text-xs text-[#7a6e65]">
                No event catering inquiries submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.partyInquiries.map(inq => (
                  <div
                    key={inq.id}
                    className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] text-xs space-y-1"
                  >
                    <div className="font-bold text-sm text-[#1a1a1a]">
                      {inq.name} — {inq.eventType} ({inq.guestCount} Guests)
                    </div>
                    <div className="text-[#5a524c]">
                      Date: {inq.eventDate} • Phone: {inq.phone}
                    </div>
                    {inq.requirements && <p className="text-[#7a6e65] mt-1">{inq.requirements}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
