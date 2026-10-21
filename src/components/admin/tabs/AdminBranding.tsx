import React, { useState } from 'react';
import { Palette, Check, RefreshCw, Eye } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { RestaurantProfile } from '../../../types';

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  desc: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'royal-saffron',
    name: 'Royal Saffron & Amber',
    primary: '#C2410C',
    secondary: '#78350F',
    accent: '#D97706',
    desc: 'Warm culinary spice, handi copper and golden saffron hues.',
  },
  {
    id: 'emerald-mint',
    name: 'Emerald & Cardamom',
    primary: '#047857',
    secondary: '#064E3B',
    accent: '#10B981',
    desc: 'Lush fresh mint chutney tones, pure vegetarian sanctity.',
  },
  {
    id: 'midnight-charcoal',
    name: 'Midnight Bistro & Gold',
    primary: '#18181B',
    secondary: '#27272A',
    accent: '#F59E0B',
    desc: 'Deep high-contrast luxury charcoal with radiant gold accents.',
  },
  {
    id: 'heritage-copper',
    name: 'Heritage Copper & Brass',
    primary: '#B45309',
    secondary: '#7C2D12',
    accent: '#FBBF24',
    desc: 'Old Delhi tandoor warmth, roasted spices and polished brass.',
  },
];

export const AdminBranding: React.FC = () => {
  const { data, updateProfile } = useRestaurant();
  const [formData, setFormData] = useState<RestaurantProfile>({ ...data.profile });
  const [saveFeedback, setSaveFeedback] = useState(false);

  const applyPreset = (preset: ThemePreset) => {
    setFormData((prev) => ({
      ...prev,
      themePreset: preset.id,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Website Branding & Themes</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Modify identity, color schemes, fonts, and hero text without touching source code.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saveFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : null}
          <span>{saveFeedback ? 'Changes Saved!' : 'Save Branding'}</span>
        </button>
      </div>

      {/* Theme Presets */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Curated Color Theme Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isSelected = formData.primaryColor === preset.primary;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.accent }}
                  />
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-neutral-900 ml-auto" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-neutral-900">{preset.name}</h4>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">{preset.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Colors & Typography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Custom Hex Color Codes
          </h3>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Primary Brand Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-8 h-8 rounded border border-neutral-300 p-0.5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-neutral-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Secondary Surface Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-8 h-8 rounded border border-neutral-300 p-0.5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-neutral-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Accent / Badge Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="w-8 h-8 rounded border border-neutral-300 p-0.5 cursor-pointer"
              />
              <input
                type="text"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-neutral-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Live Typography and Color Preview */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Font Pairing & Live Swatch
          </h3>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Heading Font Family
            </label>
            <select
              value={formData.fontHeading}
              onChange={(e) => setFormData({ ...formData, fontHeading: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            >
              <option value="Playfair Display">Playfair Display (Editorial / Luxury)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric)</option>
              <option value="Georgia, serif">Georgia (Classic Serif)</option>
              <option value="system-ui, sans-serif">Clean System Sans</option>
            </select>
          </div>

          {/* Interactive Live Sample Box */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Live Component Swatch</span>
            <div
              className="p-4 rounded-lg text-white"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <h4 className="text-base font-bold" style={{ fontFamily: formData.fontHeading }}>
                {formData.name}
              </h4>
              <p className="text-xs opacity-90 mt-1">{formData.tagline}</p>
              <button
                type="button"
                className="mt-3 px-3 py-1.5 text-xs font-bold rounded-md bg-white text-neutral-900 shadow-xs"
              >
                Order on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Headline & Identity */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Hero Copy & Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Cuisine Type / Kicker
            </label>
            <input
              type="text"
              value={formData.cuisineType}
              onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
              placeholder="e.g. North Indian · Awadhi Dum"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Hero Headline / Tagline
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Introduction Story / Bio
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Logo Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://.../logo.png"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Hero Banner Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.heroImageUrl}
              onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
              placeholder="https://.../hero.jpg"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
