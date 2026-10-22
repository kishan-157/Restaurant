import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { WebsiteSections } from '../../../types';

interface AdminSectionsProps {
  showToast?: (msg: string) => void;
}

export const AdminSections: React.FC<AdminSectionsProps> = ({ showToast }) => {
  const { data, updateSections } = useRestaurant();
  const [sections, setSections] = useState<WebsiteSections>({ ...data.websiteSections });
  const [saved, setSaved] = useState(false);

  const toggleSection = (key: keyof WebsiteSections) => {
    setSections(prev => ({
      ...prev,
      [key]: !(prev[key] !== false),
    }));
  };

  const handleSave = async () => {
    await updateSections(sections);
    setSaved(true);
    if (showToast) showToast('Section visibility updated & synced!');
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionDefinitions: { key: keyof WebsiteSections; title: string; desc: string }[] = [
    {
      key: 'showHero',
      title: 'Hero Banner & Marquee Ticker',
      desc: 'Main Sarab split hero section with circular dish showcase, floating badges, stats bar, and scrolling marquee.',
    },
    {
      key: 'showOrderModes',
      title: 'Circular Category Strip',
      desc: 'Interactive circular food category strip right below the marquee ticker.',
    },
    {
      key: 'showAbout',
      title: 'About Us & Feature Highlights',
      desc: 'Two-column story section with overlapping photos, 12+ years badge, and 4 feature cards.',
    },
    {
      key: 'showFeaturedMenu',
      title: 'Full Interactive Food Menu',
      desc: 'Filterable menu grid with search, veg/non-veg filter, category pills, and instant cart drawer.',
    },
    {
      key: 'showSpecialOffers',
      title: 'Deal of the Day & Promo Coupons',
      desc: 'Dark split Deal of the Day banner with live countdown timer + copyable promo coupon cards.',
    },
    {
      key: 'showChefs',
      title: 'Meet Our Expert Chefs',
      desc: '3-column showcase of culinary masters with specialties and ratings.',
    },
    {
      key: 'showHistory',
      title: 'Our Journey & History Timeline',
      desc: 'Horizontal/vertical milestone timeline showing how Sarab grew from 2012 to today.',
    },
    {
      key: 'showGallery',
      title: 'Food & Ambience Photo Gallery',
      desc: 'Masonry photo grid with hover captions.',
    },
    {
      key: 'showTestimonials',
      title: 'Customer Reviews & Testimonials',
      desc: 'Verified guest reviews with star ratings and ordered dish badges.',
    },
    {
      key: 'showReservation',
      title: 'Book A Table Reservation Form',
      desc: 'Interactive table booking form that sends live reservations straight to the Admin Panel.',
    },
    {
      key: 'showBlog',
      title: 'Latest Food Stories & Blog',
      desc: 'Editorial articles, recipes, and kitchen stories.',
    },
    {
      key: 'showNewsletter',
      title: 'VIP Club & Newsletter Banner',
      desc: 'Email subscription strip for exclusive weekly deals.',
    },
    {
      key: 'showLocationHours',
      title: 'Location, Opening Hours & Contact Form',
      desc: 'Address details, weekly hours schedule, and direct customer message form.',
    },
    {
      key: 'showCateringInquiry',
      title: 'Party & Event Catering Form',
      desc: 'Allow guests to request custom event and banquet catering quotes.',
    },
    {
      key: 'showFaq',
      title: 'Frequently Asked Questions (FAQ)',
      desc: 'Expandable Q&A accordion for delivery times, halal status, and allergies.',
    },
    {
      key: 'showFooter',
      title: 'Website Footer',
      desc: '4-column Sarab footer with quick links, hours, and legal policies.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#e0d6c8] rounded-3xl p-6">
        <div>
          <h2
            className="text-xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Website Section Visibility
          </h2>
          <p className="text-xs text-[#7a6e65] mt-1">
            Show or hide any section on the public Sarab website instantly. Changes sync with Supabase.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-[#e8281a] hover:bg-[#c01f12] rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          {saved && <Check className="w-4 h-4 text-white" />}
          <span>{saved ? 'Saved & Synced!' : 'Save Section Visibility'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionDefinitions.map(sec => {
          const isEnabled = sections[sec.key] !== false;
          return (
            <div
              key={sec.key}
              onClick={() => toggleSection(sec.key)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-start justify-between gap-4 select-none ${
                isEnabled
                  ? 'border-[#e8281a]/40 bg-white shadow-xs'
                  : 'border-[#e0d6c8] bg-[#fff8f0]/60 opacity-60'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-[#1a1a1a]">{sec.title}</h4>
                <p className="text-xs text-[#7a6e65] mt-1 leading-relaxed">{sec.desc}</p>
              </div>

              <div
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  isEnabled ? 'bg-[#e8281a]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
