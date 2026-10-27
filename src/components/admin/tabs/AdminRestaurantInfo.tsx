import React, { useState, useEffect, useRef } from 'react';
import { Store, Check, Clock, Upload, Trash2, Image as ImageIcon, Utensils } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DaySchedule, OpeningHours, RestaurantProfile } from '../../../types';

interface AdminRestaurantInfoProps {
  showToast?: (message: string, type?: 'success' | 'info') => void;
}

export const AdminRestaurantInfo: React.FC<AdminRestaurantInfoProps> = ({ showToast }) => {
  const { data, updateProfile, updateOpeningHours } = useRestaurant();
  const [profile, setProfile] = useState<RestaurantProfile>({ ...data.profile });
  const [openingHours, setOpeningHours] = useState<OpeningHours>({ ...data.openingHours });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile({ ...data.profile });
  }, [data.profile]);

  useEffect(() => {
    setOpeningHours({ ...data.openingHours });
  }, [data.openingHours]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleScheduleChange = (day: string, field: keyof DaySchedule, value: any) => {
    setOpeningHours((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
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
          const updated = { ...profile, logoUrl: dataUrl };
          setProfile(updated);
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
    const updated = { ...profile, logoUrl: '' };
    setProfile(updated);
    updateProfile(updated);
    if (showToast) {
      showToast('Custom logo removed (reverted to default icon).', 'info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profile);
    updateOpeningHours(openingHours);
    setSaved(true);
    if (showToast) {
      showToast(`Restaurant "${profile.name}" & settings saved!`, 'success');
    }
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">
            Restaurant Name, Logo & Hours
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Update your restaurant name, brand logo, contact coordinates, WhatsApp ordering number, and weekly hours.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#e8281a] hover:bg-[#c01f12] rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {saved && <Check className="w-4 h-4 text-white" />}
          <span>{saved ? 'Saved Successfully!' : 'Save All Changes'}</span>
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
            Updates Navbar, Footer, Chatbot & Voice Assistant automatically
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Logo Preview & Upload Box */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0">
              {profile.logoUrl && profile.logoUrl.trim() ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name || 'Logo Preview'}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${profile.primaryColor || '#e8281a'}, ${
                      profile.secondaryColor || '#f6a623'
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
                Upload PNG/JPG from your phone or computer, or paste a direct image URL below.
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
                {profile.logoUrl && profile.logoUrl.trim() && (
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
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
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
                  value={profile.tagline}
                  onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
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
                value={profile.logoUrl?.startsWith('data:') ? '' : profile.logoUrl || ''}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                placeholder={
                  profile.logoUrl?.startsWith('data:')
                    ? 'Custom uploaded logo file is active (paste URL here to replace)'
                    : 'https://example.com/my-restaurant-logo.png'
                }
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#e8281a] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Address */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Phone & Location Coordinates
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              WhatsApp Order Receiving Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.whatsappNumber}
              onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
              placeholder="e.g. 919820012345 (with country code, no +)"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
              required
            />
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Format: Country code followed by mobile (e.g., 919820012345 for India).
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Customer Call / Phone Number
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Google Maps URL / Location Pin
            </label>
            <input
              type="url"
              value={profile.googleMapsUrl}
              onChange={(e) => setProfile({ ...profile, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              City & State
            </label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Opening Hours Schedule */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Weekly Opening Hours & Holiday Notice</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Weekly Closing Day:</span>
            <input
              type="text"
              value={openingHours.weeklyClosingDay}
              onChange={(e) =>
                setOpeningHours({ ...openingHours, weeklyClosingDay: e.target.value })
              }
              placeholder="e.g. None or Monday"
              className="px-2.5 py-1 text-xs border border-neutral-200 rounded-lg"
            />
          </div>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {daysOfWeek.map((day) => {
            const sched = openingHours.schedule?.[day] || {
              isOpen: true,
              openTime: '11:30 AM',
              closeTime: '11:00 PM',
            };

            return (
              <div key={day} className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`open-${day}`}
                    checked={sched.isOpen}
                    onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor={`open-${day}`} className="font-semibold text-neutral-800 cursor-pointer">
                    {day}
                  </label>
                </div>

                {sched.isOpen ? (
                  <div className="sm:col-span-9 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-500">Opens:</span>
                      <input
                        type="text"
                        value={sched.openTime}
                        onChange={(e) => handleScheduleChange(day, 'openTime', e.target.value)}
                        className="px-2 py-1 text-xs border border-neutral-200 rounded w-24"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-500">Closes:</span>
                      <input
                        type="text"
                        value={sched.closeTime}
                        onChange={(e) => handleScheduleChange(day, 'closeTime', e.target.value)}
                        className="px-2 py-1 text-xs border border-neutral-200 rounded w-24"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="sm:col-span-9 text-red-600 font-medium italic">
                    Closed for dine-in & delivery
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Special Festive / Holiday Notice (Optional)
          </label>
          <input
            type="text"
            value={openingHours.holidayNotice || ''}
            onChange={(e) => setOpeningHours({ ...openingHours, holidayNotice: e.target.value })}
            placeholder="e.g. Open on Diwali and New Year with festive feast packages"
            className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
          />
        </div>
      </div>
    </form>
  );
};
