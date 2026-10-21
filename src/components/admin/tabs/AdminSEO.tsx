import React, { useState } from 'react';
import { Search, Check, Globe } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { SEOSettings } from '../../../types';

export const AdminSEO: React.FC = () => {
  const { data } = useRestaurant();
  const [seo, setSeo] = useState<SEOSettings>({ ...data.seo });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    data.seo = { ...seo };
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">SEO & Search Appearance</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Optimize your digital menu's preview card when shared on WhatsApp, Facebook, or Google.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saved && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{saved ? 'Saved!' : 'Save SEO'}</span>
        </button>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Meta Page Title (Recommended $\le$ 60 characters)
          </label>
          <input
            type="text"
            value={seo.metaTitle}
            onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            maxLength={70}
          />
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            {seo.metaTitle.length}/70 characters
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Meta Description (Recommended $\le$ 160 characters)
          </label>
          <textarea
            rows={3}
            value={seo.metaDescription}
            onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            maxLength={180}
          />
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            {seo.metaDescription.length}/180 characters
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Target Keywords (Comma-separated)
          </label>
          <input
            type="text"
            value={seo.keywords}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            placeholder="restaurant, dum biryani, butter chicken, bandra west, delivery"
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
          />
        </div>
      </div>

      {/* Google Search Snippet Simulation */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Google Search Result Snippet Simulation</span>
        </h3>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 max-w-lg space-y-1 font-sans">
          <span className="text-[11px] text-neutral-500 block">
            https://your-restaurant-domain.com
          </span>
          <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-1">
            {seo.metaTitle || `${data.profile.name} - Digital Menu`}
          </h4>
          <p className="text-xs text-neutral-600 line-clamp-2">
            {seo.metaDescription || data.profile.description}
          </p>
        </div>
      </div>
    </form>
  );
};
