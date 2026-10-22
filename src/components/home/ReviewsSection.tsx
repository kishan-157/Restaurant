import React from 'react';
import { Star, Calendar, Truck, MapPin, Phone, Mail } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const AVATAR_IMAGES = [
  'https://preview.themewagon.com/sarab/img/testimonial/1.jpg',
  'https://preview.themewagon.com/sarab/img/testimonial/2.jpg',
  'https://preview.themewagon.com/sarab/img/testimonial/3.jpg',
];

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ReviewsSection: React.FC = () => {
  const { data } = useRestaurant();
  const { testimonials, websiteSections, profile, openingHours, orderSettings } = data;
  const reviewsContent = data.sectionContents?.reviews;

  const scheduleRows = DAYS_ORDER.map((day) => {
    const dayCfg = openingHours.schedule[day] || {
      isOpen: true,
      openTime: '09:00 AM',
      closeTime: '10:00 PM',
    };
    return {
      label: day,
      isOpen: dayCfg.isOpen,
      time: dayCfg.isOpen ? `${dayCfg.openTime} - ${dayCfg.closeTime}` : 'Closed',
    };
  });

  return (
    <>
      {/* ===================== SARAB OPENING HOURS SECTION (#hours) ===================== */}
      {websiteSections.showLocationHours && (
        <section id="hours" className="relative py-18 sm:py-22 bg-[#2d6a4f] overflow-hidden text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <span className="slbl" style={{ color: '#a5d6bc' }}>
                Opening Hours
              </span>
              <h2 className="stitle" style={{ color: '#ffffff' }}>
                We&apos;re Open <span style={{ color: '#f6a623' }}>For You</span>
              </h2>
              <div className="sline" />
              {openingHours.holidayNotice && (
                <p className="text-xs sm:text-sm text-white/80 mt-2 max-w-lg mx-auto">
                  {openingHours.holidayNotice}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Dynamic Schedule Card (.hrscard) */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-6 space-y-2.5">
                {scheduleRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2 border-b border-white/10 last:border-none text-xs sm:text-sm"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-white/90">
                      <Calendar className="w-4 h-4 text-[#f6a623]" />
                      <span>{row.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          row.isOpen ? 'bg-emerald-400' : 'bg-[#ff6b6b]'
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          row.isOpen ? 'text-white' : 'text-[#ff6b6b]'
                        }`}
                      >
                        {row.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Center: Order Online Red CTA Card */}
              <div className="lg:col-span-3 bg-gradient-to-br from-[#e8281a] to-[#c01e12] rounded-2xl p-7 text-center shadow-[0_14px_38px_rgba(0,0,0,0.22)] flex flex-col items-center justify-center space-y-3">
                <Truck className="w-9 h-9 text-white/90 mb-1" />
                <h4 className="font-heading text-2xl font-bold text-white">Order Online</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Hot food delivered in {orderSettings.estimatedDeliveryTime || '20-25 mins'}
                </p>
                <a
                  href="#menu"
                  className="mt-2 inline-block bg-white text-[#e8281a] hover:bg-[#fff8f0] font-bold text-xs px-6 py-3 rounded-full shadow-md transition-transform hover:-translate-y-0.5"
                >
                  Order Now →
                </a>
              </div>

              {/* Right: Find Us Card */}
              <div className="lg:col-span-4 bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-6 space-y-3.5">
                <h5 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#f6a623]" />
                  <span>Find Us</span>
                </h5>

                <div className="flex items-center justify-between py-2 border-b border-white/10 text-xs gap-2">
                  <span className="inline-flex items-center gap-2 text-white/80 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[#f6a623]" />
                    <span>Address</span>
                  </span>
                  <span className="font-semibold text-white text-right">
                    {profile.address}, {profile.city}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/10 text-xs">
                  <span className="inline-flex items-center gap-2 text-white/80">
                    <Phone className="w-3.5 h-3.5 text-[#f6a623]" />
                    <span>Phone</span>
                  </span>
                  <span className="font-semibold text-white">{profile.phone}</span>
                </div>

                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="inline-flex items-center gap-2 text-white/80">
                    <Mail className="w-3.5 h-3.5 text-[#f6a623]" />
                    <span>Email</span>
                  </span>
                  <span className="font-semibold text-white">
                    {profile.email || 'hello@sarabfood.com'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== SARAB TESTIMONIALS SECTION (#testimonials) ===================== */}
      {websiteSections.showTestimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-18 sm:py-22 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="slbl">{reviewsContent?.kicker || 'What People Say'}</span>
              <h2 className="stitle">
                {reviewsContent?.title ? (
                  reviewsContent.title
                ) : (
                  <>
                    Our Customers <span>Feedback</span>
                  </>
                )}
              </h2>
              <div className="sline" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className="bg-[#fff8f0] rounded-[18px] p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex flex-col justify-between"
                >
                  <div
                    aria-hidden="true"
                    className="absolute top-3 right-5 font-heading text-7xl text-[#e8281a]/[0.08] leading-none select-none"
                  >
                    &ldquo;
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-[#f6a623] mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#f6a623]" />
                      ))}
                    </div>

                    <p className="text-sm text-[#666666] leading-[1.8] mb-5">{t.reviewText}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatarUrl || AVATAR_IMAGES[idx % AVATAR_IMAGES.length]}
                      alt={t.author}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                      }}
                      className="w-[46px] h-[46px] rounded-full object-cover border-3 border-[#e8281a]"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#1a1a1a]">{t.author}</div>
                      <div className="text-xs text-[#888888]">{t.source || 'Regular Customer'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};
