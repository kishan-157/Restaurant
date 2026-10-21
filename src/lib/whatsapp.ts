import { CartItem, CheckoutDetails, RestaurantProfile, OrderSettings } from '../types';

/**
 * Validates and normalizes phone number for WhatsApp wa.me links.
 * E.g., removes +, spaces, hyphens, and validates minimal length.
 */
export function sanitizeWhatsAppNumber(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, '');
  return digits;
}

/**
 * Builds a neatly formatted, emoji-adorned WhatsApp order message ready for click-to-chat.
 */
export function generateWhatsAppOrderMessage(
  cart: CartItem[],
  checkout: CheckoutDetails,
  profile: RestaurantProfile,
  orderSettings: OrderSettings,
  subtotal: number,
  deliveryFee: number,
  grandTotal: number
): string {
  const orderTypeLabel = checkout.orderType === 'delivery' 
    ? '🛵 HOME DELIVERY' 
    : (checkout.orderType === 'takeaway' ? '🥡 TAKEAWAY' : '🏬 SELF PICKUP');

  const lines: string[] = [];

  // Header
  lines.push(`🍽️ *NEW ORDER - ${profile.name.toUpperCase()}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 *Order Type:* ${orderTypeLabel}`);
  lines.push(`👤 *Customer Name:* ${checkout.customerName}`);
  if (checkout.customerPhone) {
    lines.push(`📞 *Customer Phone:* ${checkout.customerPhone}`);
  }

  // Delivery Address if delivery
  if (checkout.orderType === 'delivery') {
    lines.push(`📍 *Delivery Address:* ${checkout.deliveryAddress}`);
    if (checkout.deliveryLandmark) {
      lines.push(`📌 *Landmark:* ${checkout.deliveryLandmark}`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🛒 *ITEMIZED ORDER:*`);

  // Cart Items
  cart.forEach((item, index) => {
    const vegBadge = item.item.isVeg ? '🟢' : '🔴';
    const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
    lines.push(`${index + 1}. ${vegBadge} *${item.item.name}*${variantText} x ${item.quantity}`);
    lines.push(`    Price: ${profile.currencySymbol}${item.lineTotal.toFixed(2)}`);

    // Addons
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      const addonNames = item.selectedAddons.map((a) => `+ ${a.name} (${profile.currencySymbol}${a.price})`).join(', ');
      lines.push(`    Add-ons: ${addonNames}`);
    }

    if (item.customerNote) {
      lines.push(`    Note: "${item.customerNote}"`);
    }
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💵 *BILL SUMMARY:*`);
  lines.push(`• Subtotal: ${profile.currencySymbol}${subtotal.toFixed(2)}`);

  if (checkout.orderType === 'delivery') {
    if (deliveryFee === 0) {
      lines.push(`• Delivery Fee: FREE (Order above ${profile.currencySymbol}${orderSettings.freeDeliveryThreshold})`);
    } else {
      lines.push(`• Delivery Fee: ${profile.currencySymbol}${deliveryFee.toFixed(2)}`);
    }
  }

  lines.push(`⭐ *TOTAL ESTIMATED AMOUNT: ${profile.currencySymbol}${grandTotal.toFixed(2)}*`);

  if (checkout.specialInstructions) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📝 *Special Instructions / Preferences:*`);
    lines.push(`"${checkout.specialInstructions}"`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Sent via ${profile.name} Digital Menu. Please confirm availability & estimated prep time._`);

  return lines.join('\n');
}

/**
 * Creates the direct wa.me link with URL encoded message.
 */
export function buildWhatsAppLink(
  rawWhatsAppNumber: string,
  message: string
): { url: string; isValid: boolean; error?: string } {
  const cleanNumber = sanitizeWhatsAppNumber(rawWhatsAppNumber);

  if (!cleanNumber || cleanNumber.length < 10) {
    return {
      url: '',
      isValid: false,
      error: 'Restaurant WhatsApp number is missing or invalid. Please configure it in the Admin Panel.',
    };
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  return { url, isValid: true };
}
