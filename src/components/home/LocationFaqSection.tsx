import React, { useState } from 'react';
import { MapPin, Clock, Phone, MessageCircle, ChevronDown, ChevronUp, Users, ExternalLink } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface LocationFaqSectionProps {
  onOpenCatering: () => void;
}

export const LocationFaqSection: React.FC<LocationFaqSectionProps> = ({ onOpenCatering }) => {
  const { data } = useRestaurant();
  const { profile, openingHours, faqs, websiteSections } = data;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <section id="location" className="py-16 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Location & Opening Hours Row */}
        {websiteSections.showLocationHours && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Contact & Address */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Find & Contact Us
                </span>
                <h2 className="text-3xl font-bold font-heading text-neutral-900 mt-1">
                  Location & Dining Hours
                </h2>
                <p className="text-sm text-neutral-600 mt-2">
                  Visit our dining courtyard or order doorstep takeaway directly.
                </p>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Address</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                      {profile.address}, {profile.city} {profile.postalCode && `- ${profile.postalCode}`}
                    </p>
                    {profile.googleMapsUrl && (
                      <a
                        href={profile.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 mt-2"
                      >
                        <span>Open in Google Maps & Get Directions</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-neutral-200">
                  <Phone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Phone & Orders</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                      Phone: <a href={`tel:${profile.phone}`} className="hover:underline font-medium">{profile.phone}</a>
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      WhatsApp: +{profile.whatsappNumber}
                    </p>
                  </div>
                </div>

                {/* Catering card prompt */}
                {websiteSections.showCateringInquiry && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-amber-800" />
                      <span className="text-xs font-semibold text-amber-900">
                        Hosting a private party or banquet?
                      </span>
                    </div>
                    <button
                      onClick={onOpenCatering}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shrink-0"
                    >
                      Inquire Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Opening Hours Schedule Table */}
            <div className="lg:col-span-6">
              <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <h3>Weekly Service Schedule</h3>
                </div>

                <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
                  {daysOfWeek.map((day) => {
                    const sched = openingHours.schedule?.[day];
                    const isClosed = !sched || !sched.isOpen;

                    return (
                      <div key={day} className="py-2.5 flex items-center justify-between">
                        <span className="font-medium text-neutral-800">{day}</span>
                        {isClosed ? (
                          <span className="text-red-600 font-semibold text-xs">Closed</span>
                        ) : (
                          <div className="text-right">
                            <span className="text-neutral-900 font-semibold tabular-nums">
                              {sched.openTime} - {sched.closeTime}
                            </span>
                            {sched.lunchCloseTime && (
                              <span className="text-[11px] text-neutral-400 block">
                                Lunch: {sched.lunchOpenTime} - {sched.lunchCloseTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {openingHours.holidayNotice && (
                  <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 italic border border-neutral-200/60">
                    ℹ️ {openingHours.holidayNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FAQs Section */}
        {websiteSections.showFaq && faqs.length > 0 && (
          <div className="pt-8 border-t border-neutral-200 max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Got Questions?
              </span>
              <h3 className="text-2xl font-bold font-heading text-neutral-900 mt-1">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={faq.id}
                    className="border border-neutral-200 rounded-xl overflow-hidden transition-colors bg-neutral-50/50"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-neutral-900 hover:text-amber-800"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
