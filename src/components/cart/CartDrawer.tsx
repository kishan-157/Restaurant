import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  Sparkles,
  PhoneCall,
  Check,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { CheckoutDetails, OrderType, OrderItemSummary, Order } from '../../types';
import { VegNonVegBadge } from '../common/DietaryBadge';
import { generateWhatsAppOrderMessage, buildWhatsAppLink } from '../../lib/whatsapp';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const { data, addOrder } = useRestaurant();
  const { profile, orderSettings } = data;

  const [orderType, setOrderType] = useState<OrderType>(
    orderSettings.acceptHomeDelivery ? 'delivery' : 'pickup'
  );

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState('');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [showAdminSuccessModal, setShowAdminSuccessModal] = useState(false);

  // Promo / Coupon Code State in Cart Drawer
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponNotice, setCouponNotice] = useState('');

  React.useEffect(() => {
    const onApplyCoupon = (e: Event) => {
      const code = (e as CustomEvent<string>).detail;
      if (code) {
        setCouponInput(code.toUpperCase());
        setAppliedCouponCode(code.toUpperCase());
        setCouponNotice(`✅ Coupon "${code.toUpperCase()}" applied to your order!`);
      }
    };
    window.addEventListener('sarab:apply-coupon', onApplyCoupon);
    return () => window.removeEventListener('sarab:apply-coupon', onApplyCoupon);
  }, []);

  if (!isCartOpen) return null;

  const activeOffers = data.offers.filter((o) => o.isActive);
  const matchedOffer = appliedCouponCode
    ? data.offers.find((o) => o.code.toUpperCase() === appliedCouponCode.toUpperCase())
    : undefined;

  const computeCartCouponDiscount = (): { discountAmount: number; freeDelByCoupon: boolean } => {
    if (!appliedCouponCode || subtotal <= 0) {
      return { discountAmount: 0, freeDelByCoupon: false };
    }
    const code = appliedCouponCode.toUpperCase();
    const badgeAndTitle = `${matchedOffer?.discountBadge || ''} ${matchedOffer?.title || ''} ${code}`.toUpperCase();

    if (badgeAndTitle.includes('FREE DEL') || code.includes('FREEDEL')) {
      return { discountAmount: 0, freeDelByCoupon: true };
    }

    const percentMatch = badgeAndTitle.match(/(\d+)\s*%/);
    if (percentMatch) {
      const pct = Math.min(90, Math.max(1, parseInt(percentMatch[1], 10)));
      return {
        discountAmount: Math.round((subtotal * pct) / 100),
        freeDelByCoupon: false,
      };
    }

    const flatMatch = badgeAndTitle.match(/(?:₹|RS\.?|INR|FLAT\s*)(\d+)/i);
    if (flatMatch) {
      const flatAmt = parseInt(flatMatch[1], 10);
      return {
        discountAmount: Math.min(subtotal, flatAmt),
        freeDelByCoupon: false,
      };
    }

    return {
      discountAmount: Math.round(subtotal * 0.15),
      freeDelByCoupon: false,
    };
  };

  const { discountAmount: couponDiscount, freeDelByCoupon } = computeCartCouponDiscount();

  const handleApplyCartCoupon = (rawCode?: string) => {
    const code = (rawCode ?? couponInput).trim().toUpperCase();
    if (!code) {
      setCouponNotice('Please enter a coupon code.');
      return;
    }
    const found = data.offers.find((o) => o.code.toUpperCase() === code && o.isActive);
    if (found) {
      setAppliedCouponCode(found.code.toUpperCase());
      setCouponInput(found.code.toUpperCase());
      setCouponNotice(`✅ Applied "${found.code}" (${found.discountBadge})!`);
    } else {
      setCouponNotice(
        `❌ Invalid code. Try: ${activeOffers.map((o) => o.code).join(', ') || 'SARAB15'}`
      );
    }
  };

  // Delivery fee calculation
  const isDelivery = orderType === 'delivery';
  const freeThreshold = orderSettings.freeDeliveryThreshold;
  const isFreeDelivery = isDelivery && (subtotal >= freeThreshold || freeDelByCoupon);
  const deliveryFee = isDelivery ? (isFreeDelivery ? 0 : orderSettings.deliveryFee) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const amountToFreeDelivery = freeThreshold > subtotal ? freeThreshold - subtotal : 0;
  const isBelowMinOrder = isDelivery && subtotal < orderSettings.minOrderAmount;

  // Ordering mode toggles
  const isWhatsAppEnabled = orderSettings.enableWhatsAppOrdering !== false;
  const isAdminPanelEnabled = orderSettings.enableAdminPanelOrdering !== false;
  const isAnyOrderingEnabled = (isWhatsAppEnabled || isAdminPanelEnabled) && !orderSettings.temporarilyPauseOrders;

  const validateCheckout = (): boolean => {
    setErrorMsg('');

    if (orderSettings.temporarilyPauseOrders) {
      setErrorMsg(orderSettings.pauseMessage || 'Orders are temporarily paused.');
      return false;
    }

    if (!isAnyOrderingEnabled) {
      setErrorMsg('Online ordering is currently unavailable. Please call us directly.');
      return false;
    }

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return false;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return false;
    }

    if (isDelivery && !deliveryAddress.trim()) {
      setErrorMsg('Please provide your complete delivery address.');
      return false;
    }

    if (isBelowMinOrder) {
      setErrorMsg(`Minimum order for home delivery is ${profile.currencySymbol}${orderSettings.minOrderAmount}. Please add more items.`);
      return false;
    }

    return true;
  };

  const buildOrderItemSummaries = (): OrderItemSummary[] => {
    return cart.map((ci) => ({
      id: ci.item.id,
      name: ci.item.name,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      variantName: ci.selectedVariant?.name,
      addonNames: ci.selectedAddons.map((a) => a.name),
      customerNote: ci.customerNote,
      lineTotal: ci.lineTotal,
      isVeg: ci.item.isVeg,
    }));
  };

  const couponTag = appliedCouponCode
    ? ` [Coupon: ${appliedCouponCode}${
        couponDiscount > 0 ? ` -${profile.currencySymbol}${couponDiscount}` : ' FREE DEL'
      }]`
    : '';

  // Flow A: Order via WhatsApp (Logs to Admin Panel & opens WhatsApp)
  const handleWhatsAppCheckout = () => {
    if (!validateCheckout()) return;

    const checkout: CheckoutDetails = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: deliveryAddress.trim(),
      deliveryLandmark: deliveryLandmark.trim(),
      specialInstructions: `${specialInstructions.trim()}${couponTag}`.trim(),
    };

    // 1. Log order to Admin Panel
    const createdOrder = addOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: deliveryAddress.trim(),
      deliveryLandmark: deliveryLandmark.trim(),
      specialInstructions: `${specialInstructions.trim()}${couponTag}`.trim(),
      items: buildOrderItemSummaries(),
      subtotal,
      deliveryFee,
      total: grandTotal,
      channel: 'whatsapp',
      status: 'pending',
    });

    setLastPlacedOrder(createdOrder);

    // 2. Generate WhatsApp link with order ID included
    const message = generateWhatsAppOrderMessage(
      cart,
      checkout,
      profile,
      orderSettings,
      subtotal,
      deliveryFee,
      grandTotal
    );

    const fullMessageWithId = `*ORDER TICKET #${createdOrder.orderNumber}*\n` + message;
    const { url, isValid, error } = buildWhatsAppLink(profile.whatsappNumber, fullMessageWithId);

    if (!isValid || !url) {
      setErrorMsg(error || 'Could not generate WhatsApp link. Check phone number settings.');
      return;
    }

    setPendingWhatsAppUrl(url);
    setShowConfirmModal(true);
  };

  const executeWhatsAppRedirect = () => {
    if (pendingWhatsAppUrl) {
      window.open(pendingWhatsAppUrl, '_blank', 'noopener,noreferrer');
      setShowConfirmModal(false);
      clearCart();
    }
  };

  // Flow B: Direct In-App Order to Admin Panel
  const handleAdminPanelCheckout = () => {
    if (!validateCheckout()) return;

    // Log directly to Admin Panel Live Orders
    const createdOrder = addOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: deliveryAddress.trim(),
      deliveryLandmark: deliveryLandmark.trim(),
      specialInstructions: `${specialInstructions.trim()}${couponTag}`.trim(),
      items: buildOrderItemSummaries(),
      subtotal,
      deliveryFee,
      total: grandTotal,
      channel: 'admin',
      status: 'pending',
    });

    setLastPlacedOrder(createdOrder);
    setShowAdminSuccessModal(true);
    clearCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Your Order</h2>
                <p className="text-xs text-neutral-500">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  title="Clear all items"
                  className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pause notice banner */}
          {orderSettings.temporarilyPauseOrders && (
            <div className="p-3 bg-red-50 border-b border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Kitchen Paused: </span>
                {orderSettings.pauseMessage || 'Orders are paused at the moment.'}
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800">Your cart is empty</h3>
                <p className="text-sm text-neutral-500 max-w-xs">
                  Explore our authentic kebabs, slow-cooked curries, and royal dum biryanis to start your order.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 text-sm font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Free Delivery Threshold progress */}
                {orderSettings.acceptHomeDelivery && freeThreshold > 0 && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                      <span>
                        {isFreeDelivery
                          ? '🎉 You unlocked FREE Home Delivery!'
                          : `Add ${profile.currencySymbol}${amountToFreeDelivery.toFixed(0)} more for FREE Delivery`}
                      </span>
                      <span className="tabular-nums">
                        {Math.min(100, Math.round((subtotal / freeThreshold) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (subtotal / freeThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="divide-y divide-neutral-100">
                  {cart.map((cartItem) => (
                    <div key={cartItem.cartItemId} className="py-3.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <VegNonVegBadge isVeg={cartItem.item.isVeg} size="sm" />
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-900 leading-tight">
                              {cartItem.item.name}
                            </h4>
                            {cartItem.selectedVariant && (
                              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                                Size: {cartItem.selectedVariant.name}
                              </p>
                            )}
                            {cartItem.selectedAddons && cartItem.selectedAddons.length > 0 && (
                              <p className="text-xs text-neutral-500 mt-0.5">
                                Addons: {cartItem.selectedAddons.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            {cartItem.customerNote && (
                              <p className="text-xs italic text-amber-800 mt-0.5">
                                Note: {cartItem.customerNote}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold tabular-nums text-neutral-900">
                            {profile.currencySymbol}
                            {cartItem.lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Stepper & remove */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-neutral-400">
                          {profile.currencySymbol}
                          {cartItem.unitPrice.toFixed(2)} each
                        </span>

                        <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 p-0.5">
                          <button
                            onClick={() => updateQuantity(cartItem.cartItemId, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold tabular-nums text-neutral-900">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.cartItemId, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo / Coupon Code Bar */}
                <div className="pt-3 border-t border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      🏷️ Promo / Coupon Code
                    </label>
                    {appliedCouponCode && (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCouponCode(null);
                          setCouponInput('');
                          setCouponNotice('');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove ({appliedCouponCode})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g. SMASH30, SARAB15)"
                      className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCartCoupon()}
                      className="px-4 py-2 bg-neutral-900 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {activeOffers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {activeOffers.map((off) => (
                        <button
                          key={off.id}
                          type="button"
                          onClick={() => handleApplyCartCoupon(off.code)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            appliedCouponCode === off.code.toUpperCase()
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          🏷️ {off.code} ({off.discountBadge})
                        </button>
                      ))}
                    </div>
                  )}

                  {couponNotice && (
                    <p className="text-xs font-medium text-emerald-700">{couponNotice}</p>
                  )}
                </div>

                {/* Order Type Toggle */}
                <div className="pt-4 border-t border-neutral-200 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Order Fulfillment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {orderSettings.acceptHomeDelivery && (
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          orderType === 'delivery'
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span>🛵 Delivery ({orderSettings.estimatedDeliveryTime})</span>
                      </button>
                    )}
                    {orderSettings.acceptTakeaway && (
                      <button
                        type="button"
                        onClick={() => setOrderType('takeaway')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          orderType === 'takeaway'
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span>🥡 Takeaway ({orderSettings.estimatedPickupTime})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="space-y-3 pt-3 border-t border-neutral-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Contact & Delivery Details
                  </label>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 98200 12345"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  {isDelivery && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Delivery Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Flat/House No., Building Name, Street..."
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Nearby Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={deliveryLandmark}
                          onChange={(e) => setDeliveryLandmark(e.target.value)}
                          placeholder="e.g. Near HDFC Bank ATM"
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                        />
                      </div>
                    </>
                  )}

                  {!isDelivery && (
                    <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 space-y-1">
                      <p className="font-semibold text-neutral-800">Store Collection Address:</p>
                      <p>{profile.address}, {profile.city}</p>
                      <p className="text-neutral-500">{orderSettings.pickupInstructions}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Order Instructions / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="E.g., Ring bell twice, deliver before 8:30 PM"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                {/* Validation error notice */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-neutral-200 bg-neutral-50/80 space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900 tabular-nums">
                    {profile.currencySymbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount ({appliedCouponCode})</span>
                    <span className="tabular-nums">
                      -{profile.currencySymbol}
                      {couponDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                {isDelivery && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-neutral-900 tabular-nums">
                      {isFreeDelivery ? 'FREE' : `${profile.currencySymbol}${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Estimated Total</span>
                  <span className="tabular-nums text-amber-900 text-base">
                    {profile.currencySymbol}
                    {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Buttons based on enabled channel settings */}
              {(!isAnyOrderingEnabled || orderSettings.temporarilyPauseOrders) ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-amber-900">Online Ordering Currently Paused</p>
                  <p className="text-[11px] text-amber-700">
                    {orderSettings.pauseMessage || 'Please call the restaurant directly to place your order.'}
                  </p>
                </div>
              ) : isAdminPanelEnabled && isWhatsAppEnabled ? (
                <div className="space-y-2">
                  <button
                    onClick={handleAdminPanelCheckout}
                    className="w-full py-3 px-4 bg-stone-900 hover:bg-black active:scale-[0.99] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>Place Order (Send to Kitchen)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                    <span>Or Order via WhatsApp</span>
                  </button>
                  <p className="text-[11px] text-center text-neutral-500 leading-tight pt-1">
                    Orders are instantly submitted to our Kitchen Admin board for live tracking.
                  </p>
                </div>
              ) : isAdminPanelEnabled ? (
                <div className="space-y-2">
                  <button
                    onClick={handleAdminPanelCheckout}
                    className="w-full py-3.5 px-4 bg-stone-900 hover:bg-black active:scale-[0.99] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>Place Direct Order (Kitchen Queue)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                  <p className="text-[11px] text-center text-neutral-500 leading-tight">
                    Your order will be instantly received on the restaurant's live order screen.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                    <span>Order on WhatsApp</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                  <p className="text-[11px] text-center text-neutral-500 leading-tight">
                    Opens WhatsApp with your pre-filled bill and logs order in restaurant admin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal prior to WhatsApp redirect */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-neutral-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>

            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full mb-1">
                Order #{lastPlacedOrder?.orderNumber || 'PENDING'} Logged
              </span>
              <h3 className="text-lg font-bold text-neutral-900">Send Order via WhatsApp</h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Your order is logged in our Admin Panel. WhatsApp will open with your pre-filled bill so you can chat directly with <strong>{profile.name}</strong>.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl text-left text-xs space-y-1">
              <div className="flex justify-between font-medium">
                <span>Items:</span>
                <span>{lastPlacedOrder?.items.length || cart.length} dishes</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span className="font-bold text-neutral-900">
                  {profile.currencySymbol}
                  {grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Admin Kitchen Status:</span>
                <span className="text-emerald-700 font-semibold">Registered in Admin Panel</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeWhatsAppRedirect}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct In-App Admin Panel Order Success Modal */}
      {showAdminSuccessModal && lastPlacedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-neutral-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <ChefHat className="w-7 h-7 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>Ticket #{lastPlacedOrder.orderNumber}</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-neutral-900">
                Order Received in Kitchen!
              </h3>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                Thank you <strong>{lastPlacedOrder.customerName}</strong>! Your order has been placed into our Live Admin Panel queue.
              </p>
            </div>

            {/* Estimated Time Badge */}
            <div className="p-3 bg-neutral-50 rounded-xl text-left text-xs space-y-2 border border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Fulfillment Type:</span>
                <span className="font-bold text-neutral-900 capitalize">
                  {lastPlacedOrder.orderType === 'delivery' ? 'Home Delivery' : 'Pickup & Takeaway'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Estimated Time:</span>
                <span className="font-bold text-amber-800">
                  {lastPlacedOrder.orderType === 'delivery'
                    ? orderSettings.estimatedDeliveryTime
                    : orderSettings.estimatedPickupTime}
                </span>
              </div>
              {lastPlacedOrder.deliveryAddress && (
                <div className="pt-1 border-t border-neutral-200 text-neutral-600">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Deliver To:</span>
                  <p className="line-clamp-2">{lastPlacedOrder.deliveryAddress}</p>
                </div>
              )}
              <div className="pt-1 border-t border-neutral-200 flex justify-between font-medium">
                <span>Total Bill ({lastPlacedOrder.items.length} items):</span>
                <span className="text-sm font-bold text-neutral-900">
                  {profile.currencySymbol}{lastPlacedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowAdminSuccessModal(false);
                  setIsCartOpen(false);
                }}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Done & Return to Menu</span>
              </button>

              {profile.whatsappNumber && (
                <button
                  onClick={() => {
                    const msg = `Hi ${profile.name}, I placed Order Ticket #${lastPlacedOrder.orderNumber} for ${profile.currencySymbol}${lastPlacedOrder.total} (${lastPlacedOrder.customerName}, Phone: ${lastPlacedOrder.customerPhone}). Looking forward to it!`;
                    const { url } = buildWhatsAppLink(profile.whatsappNumber, msg);
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full py-2.5 px-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send Confirmation Copy to WhatsApp (Optional)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
