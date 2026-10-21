import React, { useState } from 'react';
import { Store, Check, Clock } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DaySchedule, OpeningHours, RestaurantProfile } from '../../../types';

export const AdminRestaurantInfo: React.FC = () => {
  const { data, updateProfile, updateOpeningHours } = useRestaurant();
  const [profile, setProfile] = useState<RestaurantProfile>({ ...data.profile });
  const [openingHours, setOpeningHours] = useState<OpeningHours>({ ...data.openingHours });
  const [saved, setSaved] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profile);
    updateOpeningHours(openingHours);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Restaurant Information & Hours</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure contact coordinates, WhatsApp ordering destination, and weekly dining schedule.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saved && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{saved ? 'Saved Successfully!' : 'Save Details'}</span>
        </button>
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
