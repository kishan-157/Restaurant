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

      {/* Dual Order Receiving Options: WhatsApp vs Admin Panel */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <span>Order Receiving Channels / ऑर्डर प्राप्ति के माध्यम</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choose where you want incoming customer orders to arrive. You can turn ON one or both options.
              </p>
            </div>
            
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-neutral-100 text-neutral-700">
              2 Independent Options
            </span>
          </div>
        </div>

        {/* 2 Big Action Cards for WhatsApp & Admin Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: WhatsApp Ordering */}
          <div className={`p-4 rounded-xl border-2 transition-all ${settings.enableWhatsAppOrdering ? 'border-emerald-500 bg-emerald-50/40' : 'border-neutral-200 bg-neutral-50/60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-neutral-900">
                    Option 1: Receive Orders on WhatsApp
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-800">
                  व्हाट्सएप पर ऑर्डर प्राप्त करें
                </p>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  When enabled, customers can submit orders directly to your WhatsApp (<span className="font-mono font-medium">+{profile.whatsappNumber}</span>) with pre-filled bill. Every WhatsApp order is also automatically logged into your Admin Panel orders list.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.enableWhatsAppOrdering}
                  onChange={(e) =>
                    setSettings({ ...settings, enableWhatsAppOrdering: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Status:</span>
              <span className={`font-bold ${settings.enableWhatsAppOrdering ? 'text-emerald-700' : 'text-neutral-500'}`}>
                {settings.enableWhatsAppOrdering ? '✓ Enabled (Active)' : '✕ Disabled'}
              </span>
            </div>
          </div>

          {/* Option 2: Admin Panel Live Queue */}
          <div className={`p-4 rounded-xl border-2 transition-all ${settings.enableAdminPanelOrdering ? 'border-amber-600 bg-amber-50/40' : 'border-neutral-200 bg-neutral-50/60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                  <span className="text-sm font-bold text-neutral-900">
                    Option 2: Receive Orders on Admin Panel
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-amber-900">
                  एडमिन पैनल / किचन बोर्ड पर ऑर्डर प्राप्त करें
                </p>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  When enabled, customers can place orders directly into your Admin Panel's <strong>Live Orders</strong> board without requiring WhatsApp. Kitchen staff can accept, prepare, and manage orders in real-time.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.enableAdminPanelOrdering}
                  onChange={(e) =>
                    setSettings({ ...settings, enableAdminPanelOrdering: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Status:</span>
              <span className={`font-bold ${settings.enableAdminPanelOrdering ? 'text-amber-800' : 'text-neutral-500'}`}>
                {settings.enableAdminPanelOrdering ? '✓ Enabled (Active)' : '✕ Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Mode Banner */}
        <div className="p-3 rounded-xl bg-neutral-100 text-xs flex items-center justify-between">
          <span className="font-medium text-neutral-700">Current Customer Ordering Experience:</span>
          {settings.enableWhatsAppOrdering && settings.enableAdminPanelOrdering ? (
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
              ✓ Dual Mode Active (Customers can choose Kitchen Order or WhatsApp)
            </span>
          ) : settings.enableAdminPanelOrdering ? (
            <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
              ✓ Direct Admin Panel Orders Only
            </span>
          ) : settings.enableWhatsAppOrdering ? (
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
              ✓ WhatsApp Orders Only (Logged to Admin)
            </span>
          ) : (
            <span className="font-bold text-red-800 bg-red-100 px-2.5 py-1 rounded-md">
              ✕ All Online Ordering Inactive
            </span>
          )}
        </div>

        {/* Fulfillment Capabilities: Home Delivery & Takeaway */}
        <div className="pt-2 border-t border-neutral-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">
            Fulfillment Types & Third-Party Platforms
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50 text-xs">
              <input
                type="checkbox"
                checked={settings.acceptHomeDelivery}
                onChange={(e) =>
                  setSettings({ ...settings, acceptHomeDelivery: e.target.checked })
                }
                className="rounded text-amber-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-neutral-900 block">Home Delivery</span>
                <span className="text-[11px] text-neutral-500">Doorstep delivery orders</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50 text-xs">
              <input
                type="checkbox"
                checked={settings.acceptTakeaway}
                onChange={(e) => setSettings({ ...settings, acceptTakeaway: e.target.checked })}
                className="rounded text-amber-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-neutral-900 block">Takeaway & Pickup</span>
                <span className="text-[11px] text-neutral-500">Counter collection</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50 text-xs">
              <input
                type="checkbox"
                checked={settings.enableOnlinePlatformLinks}
                onChange={(e) =>
                  setSettings({ ...settings, enableOnlinePlatformLinks: e.target.checked })
                }
                className="rounded text-amber-600 mt-0.5"
              />
              <div>
                <span className="font-bold text-neutral-900 block">Swiggy & Zomato</span>
                <span className="text-[11px] text-neutral-500">Links to external apps</span>
              </div>
            </label>
          </div>
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
