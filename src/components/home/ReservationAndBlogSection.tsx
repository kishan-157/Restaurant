import React, { useState } from 'react';
import {
  Phone,
  Clock,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  User,
  MessageSquare,
  ArrowRight,
  Send,
  Lock,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';
import { BlogPostItem } from '../../types';

export const ReservationAndBlogSection: React.FC = () => {
  const { data, addReservation } = useRestaurant();
  const { profile, openingHours, websiteSections } = data;

  const locContent =
    data.sectionContents?.location || DEFAULT_RESTAURANT_DATA.sectionContents!.location;
  const nlContent =
    data.sectionContents?.newsletter || DEFAULT_RESTAURANT_DATA.sectionContents!.newsletter!;
  const blogPosts =
    data.blogPosts && data.blogPosts.length > 0
      ? data.blogPosts
      : DEFAULT_RESTAURANT_DATA.blogPosts!;

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [partySize, setPartySize] = useState('2 People');
  const [resDate, setResDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [resTime, setResTime] = useState('07:00 PM');
  const [specialRequest, setSpecialRequest] = useState('');
  const [resSuccess, setResSuccess] = useState(false);

  const [nlEmail, setNlEmail] = useState('');
  const [nlSubscribed, setNlSubscribed] = useState(false);
  const [activePost, setActivePost] = useState<BlogPostItem | null>(null);

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) return;
    addReservation({
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      partySize,
      reservationDate: resDate,
      reservationTime: resTime,
      specialRequest: specialRequest.trim(),
    });
    setResSuccess(true);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlSubscribed(true);
    setNlEmail('');
  };

  return (
    <>
      {/* ===================== SARAB RESERVATION SECTION (#reservation) ===================== */}
      {websiteSections.showReservation !== false && (
        <section id="reservation" className="py-14 sm:py-22 bg-[#f9f5f0] w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="slbl">{locContent.reservationKicker || 'Book a Table'}</span>
              <h2 className="stitle">
                {locContent.reservationTitle ? (
                  locContent.reservationTitle
                ) : (
                  <>
                    Make a <span>Reservation</span>
                  </>
                )}
              </h2>
              <div className="sline" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Info Column */}
              <div className="lg:col-span-5 space-y-6">
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-[#1a1a1a] leading-snug">
                  {locContent.reservationHeading ||
                    'Reserve Your Table for an Unforgettable Meal'}
                </h3>
                <p className="text-sm text-[#777777] leading-[1.8]">
                  {locContent.reservationSubtitle ||
                    'Planning a family dinner, birthday celebration, or Friday night burger feast? Book your table online in seconds and our team will have your spot ready.'}
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-[54px] h-[54px] rounded-[13px] bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-[#999999] uppercase tracking-wider font-semibold block">
                        Booking Desk
                      </span>
                      <span className="font-bold text-base text-[#1a1a1a]">{profile.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-[54px] h-[54px] rounded-[13px] bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-[#999999] uppercase tracking-wider font-semibold block">
                        Dining Hours
                      </span>
                      <span className="font-bold text-base text-[#1a1a1a]">
                        {openingHours.topbarHoursText || 'Wed - Sun: 09:00 AM - 11:00 PM'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-[54px] h-[54px] rounded-[13px] bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-[#999999] uppercase tracking-wider font-semibold block">
                        Location
                      </span>
                      <span className="font-bold text-base text-[#1a1a1a]">
                        {profile.address}, {profile.city}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right White Form Card */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[18px] p-6 sm:p-8 shadow-[0_6px_30px_rgba(0,0,0,0.08)]">
                  <form onSubmit={handleReservationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => {
                            setGuestName(e.target.value);
                            if (resSuccess) setResSuccess(false);
                          }}
                          placeholder="John Doe"
                          className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                          Number of Guests
                        </label>
                        <select
                          value={partySize}
                          onChange={(e) => setPartySize(e.target.value)}
                          className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors bg-white"
                        >
                          <option value="1 Person">1 Person</option>
                          <option value="2 People">2 People</option>
                          <option value="4 People">4 People</option>
                          <option value="6 People">6 People</option>
                          <option value="8+ People">8+ People</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                          Reservation Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={resDate}
                          onChange={(e) => setResDate(e.target.value)}
                          className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                          Preferred Time
                        </label>
                        <select
                          value={resTime}
                          onChange={(e) => setResTime(e.target.value)}
                          className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors bg-white"
                        >
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="01:30 PM">01:30 PM</option>
                          <option value="06:00 PM">06:00 PM</option>
                          <option value="07:00 PM">07:00 PM</option>
                          <option value="08:30 PM">08:30 PM</option>
                          <option value="09:30 PM">09:30 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                        Special Request
                      </label>
                      <textarea
                        rows={3}
                        value={specialRequest}
                        onChange={(e) => setSpecialRequest(e.target.value)}
                        placeholder="Any dietary requirements or special occasion notes..."
                        className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                      />
                    </div>

                    <button type="submit" className="btn-red w-full justify-center">
                      <CalendarCheck className="w-4 h-4" />
                      <span>Confirm Reservation</span>
                    </button>

                    {resSuccess && (
                      <div className="p-4 rounded-xl bg-[#2d6a4f]/10 text-[#2d6a4f] text-center space-y-1">
                        <CheckCircle2 className="w-6 h-6 mx-auto" />
                        <p className="text-sm font-semibold">
                          Reservation sent to the Admin Dashboard! Confirmed for {guestName} (
                          {partySize}) on {resDate} at {resTime}.
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== SARAB BLOG SECTION (#blog) ===================== */}
      {websiteSections.showBlog !== false && blogPosts.length > 0 && (
        <section id="blog" className="py-14 sm:py-22 bg-[#f9f5f0] border-t border-neutral-200/60 w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="slbl">News &amp; Updates</span>
              <h2 className="stitle">
                Our Latest <span>Blog</span> Posts
              </h2>
              <div className="sline" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setActivePost(post)}
                  className="group bg-white rounded-[18px] overflow-hidden shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Blog Image */}
                  <div className="relative h-[195px] overflow-hidden bg-[#fef0dc]">
                    <img
                      src={post.imageUrl || 'https://preview.themewagon.com/sarab/img/blog/1.jpg'}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3.5 left-3.5 bg-[#e8281a] text-white rounded-[9px] px-3 py-1.5 text-center leading-tight shadow-md">
                      <span className="text-lg font-extrabold block">{post.day}</span>
                      <span className="text-[10px] uppercase tracking-wider">{post.month}</span>
                    </div>
                  </div>

                  {/* Blog Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-[#e8281a] uppercase tracking-wider mb-1.5">
                        {post.tag}
                      </div>
                      <h3 className="font-heading text-base font-bold text-[#1a1a1a] group-hover:text-[#e8281a] transition-colors leading-snug mb-2.5">
                        {post.title}
                      </h3>
                    </div>

                    <div>
                      <div className="flex items-center gap-4 text-xs text-[#999999] mb-3">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#e8281a]" />
                          <span>{post.author}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#e8281a]" />
                          <span>{post.commentsLabel}</span>
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-[#e8281a] group-hover:text-[#1a1a1a] inline-flex items-center gap-1.5 transition-colors">
                        <span>Read More</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== SARAB NEWSLETTER SECTION (#newsletter) ===================== */}
      {websiteSections.showNewsletter !== false && (
        <section
          id="newsletter"
          className="relative w-full max-w-[100vw] overflow-hidden py-14 sm:py-20 text-center"
          style={{
            background: 'linear-gradient(135deg, #e8281a, #8b0000)',
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
            <span className="slbl" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {nlContent.kicker || 'Stay Connected'}
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white">
              {nlContent.title || 'Subscribe & Get Exclusive'}{' '}
              <span className="text-[#f6a623]">{nlContent.highlightWord || 'Deals'}</span>
            </h2>
            <p className="text-sm text-white/80">
              {nlContent.subtitle ||
                'Get 15% off your first order plus early access to new menu items'}
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row items-center gap-2.5 max-w-xl mx-auto pt-2"
            >
              <input
                type="email"
                required
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full flex-1 rounded-full bg-white px-6 py-3.5 text-sm text-[#333333] outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto rounded-full bg-[#f6a623] hover:bg-[#ffba42] text-[#1a1a1a] font-bold text-sm px-7 py-3.5 inline-flex items-center justify-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>{nlContent.buttonText || 'Subscribe'}</span>
              </button>
            </form>

            {nlSubscribed ? (
              <p className="text-xs font-semibold text-[#f6a623] pt-1">
                {nlContent.successMessage ||
                  'Welcome! Use code SARAB15 at checkout for 15% off your first order.'}
              </p>
            ) : (
              <p className="text-xs text-white/50 pt-1 inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>No spam, unsubscribe anytime.</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Blog Post Modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActivePost(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-[#e8281a] text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={activePost.imageUrl}
              alt={activePost.title}
              className="w-full h-60 object-cover"
            />
            <div className="p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e8281a]">
                {activePost.tag} · {activePost.day} {activePost.month}
              </span>
              <h3 className="font-heading text-2xl font-bold text-[#1a1a1a]">
                {activePost.title}
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed">{activePost.content}</p>
              <div className="pt-3 flex items-center justify-between border-t border-neutral-100 text-xs text-[#888888]">
                <span>By {activePost.author}</span>
                <button
                  onClick={() => setActivePost(null)}
                  className="btn-red py-2 px-5 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
