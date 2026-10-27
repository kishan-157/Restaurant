import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, Upload, Trash2, Utensils, Store, Image as ImageIcon } from 'lucide-react';
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

interface AdminBrandingProps {
  showToast?: (message: string, type?: 'success' | 'info') => void;
}

export const AdminBranding: React.FC<AdminBrandingProps> = ({ showToast }) => {
  const { data, updateProfile } = useRestaurant();
  const [formData, setFormData] = useState<RestaurantProfile>({ ...data.profile });
  const [saveFeedback, setSaveFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...data.profile });
  }, [data.profile]);

  const applyPreset = (preset: ThemePreset) => {
    setFormData((prev) => ({
      ...prev,
      themePreset: preset.id,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.92);
          const updated = { ...formData, logoUrl: dataUrl };
          setFormData(updated);
          updateProfile(updated);
          if (showToast) {
            showToast('Logo uploaded & applied live across the website!', 'success');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    const updated = { ...formData, logoUrl: '' };
    setFormData(updated);
    updateProfile(updated);
    if (showToast) {
      showToast('Custom logo removed (reverted to default icon).', 'info');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveFeedback(true);
    if (showToast) {
      showToast(`Branding & "${formData.name}" saved!`, 'success');
    }
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Website Branding, Logo & Themes</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Modify restaurant name, brand logo, color schemes, and fonts without touching source code.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#e8281a] hover:bg-[#c01f12] rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {saveFeedback ? <Check className="w-4 h-4 text-white" /> : null}
          <span>{saveFeedback ? 'Changes Saved!' : 'Save Branding'}</span>
        </button>
      </div>

      {/* Restaurant Identity: Name, Tagline & Logo */}
      <div className="p-5 bg-white rounded-2xl border-2 border-[#e8281a]/20 shadow-xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e8281a] flex items-center gap-1.5">
            <Store className="w-4 h-4" />
            <span>Restaurant Name, Tagline & Brand Logo</span>
          </h3>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Live syncs to Navbar, Footer, Chatbot & Voice Assistant
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Logo Preview & Upload Box */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0">
              {formData.logoUrl && formData.logoUrl.trim() ? (
                <img
                  src={formData.logoUrl}
                  alt={formData.name || 'Logo Preview'}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor || '#e8281a'}, ${
                      formData.secondaryColor || '#f6a623'
                    })`,
                  }}
                >
                  <Utensils className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="text-xs font-bold text-neutral-900">Restaurant Brand Logo</div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Upload PNG/JPG from your device or paste a direct logo image URL.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>
                {formData.logoUrl && formData.logoUrl.trim() && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Restaurant Name, Tagline & Logo URL Fields */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Spice Kitchen"
                  className="w-full px-3 py-2.5 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#e8281a] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Brand Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Fast Food & Fine Dining"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#e8281a] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                <span>Or Paste Logo Image URL (Optional)</span>
              </label>
              <input
                type="text"
                value={formData.logoUrl?.startsWith('data:') ? '' : formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder={
                  formData.logoUrl?.startsWith('data:')
                    ? 'Custom uploaded logo file is active (paste URL here to replace)'
                    : 'https://example.com/my-restaurant-logo.png'
                }
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#e8281a] focus:outline-none"
              />
            </div>
          </div>
        </div>
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
                className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
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

      {/* Additional Story & Cuisine Info */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Cuisine Type, Footer Bio & Hero Banner
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Hero Banner Image URL (Optional)
            </label>
            <input
              type="text"
              value={formData.heroImageUrl}
              onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
              placeholder="https://.../hero.jpg"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Footer Story / Bio Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
          />
        </div>
      </div>
    </form>
  );
};
