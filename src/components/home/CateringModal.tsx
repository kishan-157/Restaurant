import React, { useState } from 'react';
import { X, Calendar, Users, Phone, CheckCircle2, MessageCircle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { buildWhatsAppLink } from '../../lib/whatsapp';

interface CateringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CateringModal: React.FC<CateringModalProps> = ({ isOpen, onClose }) => {
  const { data, submitPartyInquiry } = useRestaurant();
  const { profile } = data;

  const [guestCount, setGuestCount] = useState<number>(25);
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'Birthday' | 'Anniversary' | 'Corporate' | 'Family Gathering' | 'Other'>('Birthday');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!eventDate) {
      setErrorMsg('Please select your preferred event date.');
      return;
    }

    const ok = await submitPartyInquiry({
      guestCount,
      eventDate,
      eventType,
      name: name.trim(),
      phone: phone.trim(),
      requirements: requirements.trim(),
    });

    if (ok) {
      setIsSubmitted(true);
    }
  };

  const handleSendToWhatsApp = () => {
    const text = `🎉 *PARTY / CATERING INQUIRY - ${profile.name.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━━━━\n👤 *Client Name:* ${name}\n📞 *Phone:* ${phone}\n📅 *Event Date:* ${eventDate}\n👥 *Estimated Guests:* ${guestCount} Pax\n🎈 *Occasion:* ${eventType}\n📝 *Requirements:* ${requirements || 'Standard royal thali / live counter'}\n━━━━━━━━━━━━━━━━━━━━━\n_Please send custom menu package and quote._`;
    const { url } = buildWhatsAppLink(profile.whatsappNumber, text);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">Inquiry Received!</h3>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
              Thank you, <strong>{name}</strong>. Our banquet manager will review your guest count ({guestCount} pax) and get in touch with you shortly.
            </p>

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={handleSendToWhatsApp}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Catering Manager on WhatsApp</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Bulk Bookings & Parties</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-neutral-900">
                Plan Your Private Party or Catering
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                From intimate family reunions to 200-guest receptions with live tandoor stations.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Occasion Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="Birthday">Birthday Celebration</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Family Gathering">Family Gathering</option>
                  <option value="Corporate">Corporate Luncheon / Dinner</option>
                  <option value="Other">Other Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Estimated Guests
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Your Phone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98200 12345"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Organizer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Specific Menu Preferences / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="E.g., Jain vegetarian dishes needed, prefer Biryani live counter, setup at our venue..."
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
              >
                Submit Inquiry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
