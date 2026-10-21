import React from 'react';
import { ExternalLink, ShoppingBag, Bike, Utensils } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';

export const OrderModesBar: React.FC = () => {
  const { data } = useRestaurant();
  const { orderSettings, profile } = data;
  const { setIsCartOpen } = useCart();

  if (!data.websiteSections.showOrderModes) return null;

  const hasSwiggy = Boolean(orderSettings.enableOnlinePlatformLinks && orderSettings.swiggyUrl);
  const hasZomato = Boolean(orderSettings.enableOnlinePlatformLinks && orderSettings.zomatoUrl);
  const hasOther = Boolean(
    orderSettings.enableOnlinePlatformLinks &&
      orderSettings.otherPlatformUrl &&
      orderSettings.otherPlatformName
  );

  return (
    <div className="bg-white border-b border-neutral-200 py-4 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Order Methods Overview */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-600">
            {orderSettings.acceptHomeDelivery && (
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-neutral-900">Direct Delivery:</span>
                <span>{orderSettings.estimatedDeliveryTime}</span>
              </div>
            )}
            {orderSettings.acceptTakeaway && (
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-neutral-900">Takeaway:</span>
                <span>{orderSettings.estimatedPickupTime}</span>
              </div>
            )}
            {orderSettings.freeDeliveryThreshold > 0 && (
              <span className="hidden lg:inline text-neutral-400">·</span>
            )}
            {orderSettings.freeDeliveryThreshold > 0 && (
              <span className="hidden lg:inline text-amber-800 font-medium">
                Free delivery on orders above {profile.currencySymbol}{orderSettings.freeDeliveryThreshold}
              </span>
            )}
          </div>

          {/* External Platform Badges & Direct Order CTA */}
          <div className="flex items-center gap-3 ml-auto">
            {hasZomato && (
              <a
                href={orderSettings.zomatoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Order on Zomato"
              >
                <span>Zomato</span>
                <ExternalLink className="w-3 h-3 text-red-500" />
              </a>
            )}

            {hasSwiggy && (
              <a
                href={orderSettings.swiggyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Order on Swiggy"
              >
                <span>Swiggy</span>
                <ExternalLink className="w-3 h-3 text-orange-500" />
              </a>
            )}

            {hasOther && (
              <a
                href={orderSettings.otherPlatformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>{orderSettings.otherPlatformName}</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            )}

            {orderSettings.enableCartAndCheckout && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Direct Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
