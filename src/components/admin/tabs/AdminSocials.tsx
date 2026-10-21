import React, { useState } from 'react';
import { Share2, Check, ExternalLink } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { SocialLinks, OrderSettings } from '../../../types';

export const AdminSocials: React.FC = () => {
  const { data, updateOrderSettings } = useRestaurant();
  const [orderSettings, setOrderSettings] = useState<OrderSettings>({ ...data.orderSettings });
  const [socials, setSocials] = useState<SocialLinks>({ ...data.socials });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderSettings({
      swiggyUrl: orderSettings.swiggyUrl,
      zomatoUrl: orderSettings.zomatoUrl,
      otherPlatformName: orderSettings.otherPlatformName,
      otherPlatformUrl: orderSettings.otherPlatformUrl,
    });
    // save socials
    data.socials = { ...socials };
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">External Platforms & Social Media</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure delivery aggregators (Swiggy, Zomato) and social engagement profiles.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saved && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{saved ? 'Links Saved!' : 'Save Links'}</span>
        </button>
      </div>

      {/* Food Aggregators */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Online Delivery Aggregator Links
        </h3>
        <p className="text-xs text-neutral-500">
          These display as external buttons on the homepage for customers preferring Swiggy/Zomato.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Zomato Listing URL
            </label>
            <input
              type="url"
              value={orderSettings.zomatoUrl}
              onChange={(e) => setOrderSettings({ ...orderSettings, zomatoUrl: e.target.value })}
              placeholder="https://www.zomato.com/restaurant-slug"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Swiggy Listing URL
            </label>
            <input
              type="url"
              value={orderSettings.swiggyUrl}
              onChange={(e) => setOrderSettings({ ...orderSettings, swiggyUrl: e.target.value })}
              placeholder="https://www.swiggy.com/restaurants/restaurant-slug"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Other Platform Name (Optional)
            </label>
            <input
              type="text"
              value={orderSettings.otherPlatformName}
              onChange={(e) =>
                setOrderSettings({ ...orderSettings, otherPlatformName: e.target.value })
              }
              placeholder="e.g. Magicpin or DotPe"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Other Platform URL
            </label>
            <input
              type="url"
              value={orderSettings.otherPlatformUrl}
              onChange={(e) =>
                setOrderSettings({ ...orderSettings, otherPlatformUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Social Media & Reviews Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Instagram Handle URL
            </label>
            <input
              type="url"
              value={socials.instagram}
              onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
              placeholder="https://instagram.com/your_handle"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Facebook Page URL
            </label>
            <input
              type="url"
              value={socials.facebook}
              onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
              placeholder="https://facebook.com/your_page"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
