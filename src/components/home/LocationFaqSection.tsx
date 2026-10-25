import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Instagram,
  Facebook,
  Twitter,
  Users,
  ChevronDown,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

interface LocationFaqSectionProps {
  onOpenCatering: () => void;
}

export const LocationFaqSection: React.FC<LocationFaqSectionProps> = ({ onOpenCatering }) => {
  const { data, addContactMessage } = useRestaurant();
  const { profile, websiteSections, socials, faqs, openingHours } = data;
  const locContent =
    data.sectionContents?.location || DEFAULT_RESTAURANT_DATA.sectionContents!.location;
  const faqContent = data.sectionContents?.faq || DEFAULT_RESTAURANT_DATA.sectionContents!.faq;

  const [ctcName, setCtcName] = useState('');
  const [ctcEmail, setCtcEmail] = useState('');
  const [ctcSubject, setCtcSubject] = useState('');
  const [ctcMessage, setCtcMessage] = useState('');
  const [ctcSent, setCtcSent] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctcName.trim() || !ctcMessage.trim()) return;
    addContactMessage({
      name: ctcName.trim(),
      email: ctcEmail.trim(),
      subject: ctcSubject.trim(),
      message: ctcMessage.trim(),
    });
    setCtcSent(true);
    setCtcName('');
    setCtcEmail('');
    setCtcSubject('');
    setCtcMessage('');
  };

  return (
    <>
      <section id="contact-section" className="py-14 sm:py-22 bg-white w-full max-w-[100vw] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="slbl">{locContent.kicker || 'Get In Touch'}</span>
            <h2 className="stitle">
              {locContent.title ? (
                locContent.title
              ) : (
                <>
                  Contact <span>Us</span>
                </>
              )}
            </h2>
            <div className="sline" />
            <p className="text-[#777777] text-sm sm:text-[15px] max-w-[480px] mx-auto leading-[1.8]">
              {locContent.subtitle ||
                "Have a question, feedback, or want to plan a special event? We'd love to hear from you."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Dark Contact Info Card */}
            <div className="lg:col-span-4 bg-[#1a1a1a] rounded-[18px] p-8 sm:p-9 text-white flex flex-col justify-between">
              <div>
                <h4 className="font-heading text-2xl font-bold text-white mb-1.5">
                  Let&apos;s Talk
                </h4>
                <p className="text-white/60 text-sm mb-7">
                  Reach out to us directly or drop by our restaurant in the Food District.
                </p>

                <div className="space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-[9px] bg-[#e8281a]/20 text-[#e8281a] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-[#aaaaaa] text-[11px] uppercase tracking-wider">
                        Our Location
                      </strong>
                      <span className="text-white text-sm">
                        {profile.address}, {profile.city}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-[9px] bg-[#e8281a]/20 text-[#e8281a] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-[#aaaaaa] text-[11px] uppercase tracking-wider">
                        Phone Number
                      </strong>
                      <span className="text-white text-sm">{profile.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-[9px] bg-[#e8281a]/20 text-[#e8281a] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-[#aaaaaa] text-[11px] uppercase tracking-wider">
                        Email Address
                      </strong>
                      <span className="text-white text-sm break-all">
                        {profile.email || 'hello@sarabfood.com'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-[9px] bg-[#e8281a]/20 text-[#e8281a] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-[#aaaaaa] text-[11px] uppercase tracking-wider">
                        Opening Hours
                      </strong>
                      <span className="text-white text-sm">
                        {openingHours.topbarHoursText || 'Wed - Sun: 9:00 AM - 11:00 PM'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {socials.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#e8281a] text-[#bbbbbb] hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {socials.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#e8281a] text-[#bbbbbb] hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {socials.twitter && (
                    <a
                      href={socials.twitter}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Twitter"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#e8281a] text-[#bbbbbb] hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {websiteSections.showCateringInquiry && (
                  <button
                    type="button"
                    onClick={onOpenCatering}
                    className="px-3.5 py-2 rounded-lg bg-[#f6a623] text-[#1a1a1a] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#ffba42] transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{locContent.cateringButtonText || 'Event Catering'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-8 bg-white rounded-[18px] p-7 sm:p-9 shadow-[0_6px_30px_rgba(0,0,0,0.08)] border border-neutral-100">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={ctcName}
                      onChange={(e) => {
                        setCtcName(e.target.value);
                        if (ctcSent) setCtcSent(false);
                      }}
                      placeholder="Enter your name"
                      className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={ctcEmail}
                      onChange={(e) => setCtcEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={ctcSubject}
                    onChange={(e) => setCtcSubject(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#1a1a1a] mb-1.5 block">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={ctcMessage}
                    onChange={(e) => setCtcMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full border-2 border-[#eeeeee] focus:border-[#e8281a] rounded-[9px] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition-colors"
                  />
                </div>

                <button type="submit" className="btn-red">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>

                {ctcSent && (
                  <div className="p-4 rounded-xl bg-[#2d6a4f]/10 text-[#2d6a4f] flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>
                      Thank you! Your message has been delivered to the Sarab Admin Dashboard.
                    </span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SARAB FAQ SECTION (#faq) ===================== */}
      {websiteSections.showFaq && faqs.length > 0 && (
        <section id="faq" className="py-14 sm:py-16 bg-[#fff8f0] border-t border-[#fef0dc] w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="slbl">{faqContent.kicker || 'Got Questions?'}</span>
              <h2 className="stitle">
                {faqContent.title || (
                  <>
                    Frequently Asked <span>Questions</span>
                  </>
                )}
              </h2>
              <div className="sline" />
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-neutral-200/70 overflow-hidden shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#fff8f0]/50 transition-colors"
                    >
                      <span className="font-heading font-bold text-base text-[#1a1a1a]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#e8281a] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-sm text-[#666666] leading-relaxed border-t border-neutral-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
};
