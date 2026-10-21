import React, { useState } from 'react';
import { Truck, Check, AlertCircle } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { OrderSettings } from '../../../types';

export const AdminOrderSettings: React.FC = () => {
  const { data, updateOrderSettings } = useRestaurant();
  const { profile } = data;
  const [settings, setSettings] = useState<OrderSettings>({ ...data.orderSettings });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Order & Delivery Settings</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Set delivery fees, minimum checkout values, and pause kitchen ordering if overloaded.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saved && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{saved ? 'Settings Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Emergency Pause Kitchen Orders Switch */}
      <div className="p-4 rounded-2xl border border-red-200 bg-red-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Temporarily Pause New Orders</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.temporarilyPauseOrders}
              onChange={(e) =>
                setSettings({ ...settings, temporarilyPauseOrders: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
          </label>
        </div>

        {settings.temporarilyPauseOrders && (
          <div>
            <label className="block text-xs font-medium text-red-900 mb-1">
              Customer Notice Banner Message
            </label>
            <input
              type="text"
              value={settings.pauseMessage}
              onChange={(e) => setSettings({ ...settings, pauseMessage: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Capabilities Toggles */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Enabled Fulfillment Channels
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={settings.acceptHomeDelivery}
              onChange={(e) =>
                setSettings({ ...settings, acceptHomeDelivery: e.target.checked })
              }
              className="rounded text-amber-600 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Home Delivery</span>
              <span className="text-[11px] text-neutral-500">Allow customers to order for direct doorstep delivery</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={settings.acceptTakeaway}
              onChange={(e) => setSettings({ ...settings, acceptTakeaway: e.target.checked })}
              className="rounded text-amber-600 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Takeaway & Pickup</span>
              <span className="text-[11px] text-neutral-500">Allow customers to collect hot food at counter</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={settings.enableWhatsAppOrdering}
              onChange={(e) =>
                setSettings({ ...settings, enableWhatsAppOrdering: e.target.checked })
              }
              className="rounded text-amber-600 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block">WhatsApp Click-to-Chat</span>
              <span className="text-[11px] text-neutral-500">Generate formatted order bill directly into customer's WhatsApp</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={settings.enableOnlinePlatformLinks}
              onChange={(e) =>
                setSettings({ ...settings, enableOnlinePlatformLinks: e.target.checked })
              }
              className="rounded text-amber-600 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Swiggy / Zomato Links</span>
              <span className="text-[11px] text-neutral-500">Show links to third-party delivery apps</span>
            </div>
          </label>
        </div>
      </div>

      {/* Delivery Financial & Time Settings */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Delivery Charges & Thresholds
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Standard Delivery Fee ({profile.currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              value={settings.deliveryFee}
              onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Free Delivery Above ({profile.currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              value={settings.freeDeliveryThreshold}
              onChange={(e) =>
                setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Minimum Order ({profile.currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              value={settings.minOrderAmount}
              onChange={(e) =>
                setSettings({ ...settings, minOrderAmount: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              value={settings.estimatedDeliveryTime}
              onChange={(e) =>
                setSettings({ ...settings, estimatedDeliveryTime: e.target.value })
              }
              placeholder="e.g. 35-45 mins"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Estimated Takeaway Prep Time
            </label>
            <input
              type="text"
              value={settings.estimatedPickupTime}
              onChange={(e) =>
                setSettings({ ...settings, estimatedPickupTime: e.target.value })
              }
              placeholder="e.g. 15-20 mins"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Delivery Coverage Instructions
          </label>
          <input
            type="text"
            value={settings.serviceAreaNotes}
            onChange={(e) => setSettings({ ...settings, serviceAreaNotes: e.target.value })}
            placeholder="e.g. Delivering within 6 km radius across Bandra and Santacruz"
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
          />
        </div>
      </div>
    </form>
  );
};
