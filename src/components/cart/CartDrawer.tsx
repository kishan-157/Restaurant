import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { CheckoutDetails, OrderType } from '../../types';
import { VegNonVegBadge } from '../common/DietaryBadge';
import { generateWhatsAppOrderMessage, buildWhatsAppLink } from '../../lib/whatsapp';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const { data } = useRestaurant();
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

  if (!isCartOpen) return null;

  // Delivery fee calculation
  const isDelivery = orderType === 'delivery';
  const freeThreshold = orderSettings.freeDeliveryThreshold;
  const isFreeDelivery = isDelivery && subtotal >= freeThreshold;
  const deliveryFee = isDelivery ? (isFreeDelivery ? 0 : orderSettings.deliveryFee) : 0;
  const grandTotal = subtotal + deliveryFee;

  const amountToFreeDelivery = freeThreshold > subtotal ? freeThreshold - subtotal : 0;
  const isBelowMinOrder = isDelivery && subtotal < orderSettings.minOrderAmount;

  const handleCheckoutClick = () => {
    setErrorMsg('');

    if (orderSettings.temporarilyPauseOrders) {
      setErrorMsg(orderSettings.pauseMessage || 'Orders are temporarily paused.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isDelivery && !deliveryAddress.trim()) {
      setErrorMsg('Please provide your complete delivery address.');
      return;
    }

    if (isBelowMinOrder) {
      setErrorMsg(`Minimum order for home delivery is ${profile.currencySymbol}${orderSettings.minOrderAmount}. Please add more items.`);
      return;
    }

    // Build checkout object
    const checkout: CheckoutDetails = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: deliveryAddress.trim(),
      deliveryLandmark: deliveryLandmark.trim(),
      specialInstructions: specialInstructions.trim(),
    };

    // Generate formatted message
    const message = generateWhatsAppOrderMessage(
      cart,
      checkout,
      profile,
      orderSettings,
      subtotal,
      deliveryFee,
      grandTotal
    );

    const { url, isValid, error } = buildWhatsAppLink(profile.whatsappNumber, message);

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
      // Keep cart or allow customer to clear
    }
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

              {/* Order via WhatsApp Button */}
              <button
                onClick={handleCheckoutClick}
                disabled={orderSettings.temporarilyPauseOrders}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white text-white" />
                <span>Order on WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <p className="text-[11px] text-center text-neutral-500 leading-tight">
                Clicking opens WhatsApp with your pre-filled bill. No immediate charge; restaurant confirms order directly with you.
              </p>
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
              <h3 className="text-lg font-bold text-neutral-900">Send Order via WhatsApp</h3>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                We have generated your order for <strong>{profile.name}</strong>. WhatsApp will open with your pre-filled order message. Please press <strong>Send</strong> in WhatsApp to submit your request!
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl text-left text-xs space-y-1">
              <div className="flex justify-between font-medium">
                <span>Items:</span>
                <span>{cart.length} dishes</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span className="font-bold text-neutral-900">
                  {profile.currencySymbol}
                  {grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Destination:</span>
                <span>+{profile.whatsappNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Back to Cart
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
    </div>
  );
};
