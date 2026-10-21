import React, { useState } from 'react';
import { Layers, Check } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { WebsiteSections } from '../../../types';

export const AdminSections: React.FC = () => {
  const { data, updateSections } = useRestaurant();
  const [sections, setSections] = useState<WebsiteSections>({ ...data.websiteSections });
  const [saved, setSaved] = useState(false);

  const toggleSection = (key: keyof WebsiteSections) => {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateSections(sections);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionDefinitions: { key: keyof WebsiteSections; title: string; desc: string }[] = [
    {
      key: 'showHero',
      title: 'Hero Banner & Headline',
      desc: 'Top visual header with restaurant tagline, CTAs, and quality trust indicators.',
    },
    {
      key: 'showOrderModes',
      title: 'Fulfillment & External Platform Bar',
      desc: 'Strip showing delivery times, free delivery perks, and Swiggy/Zomato buttons.',
    },
    {
      key: 'showSpecialOffers',
      title: 'Special Promo Offers & Coupons',
      desc: 'Cards showing promotional codes (e.g. FIRSTBITE, FREESHIP) with copy button.',
    },
    {
      key: 'showFeaturedMenu',
      title: 'Digital Menu & Categories',
      desc: 'Complete interactive catalog with category tabs, search, veg/non-veg filter, and customization.',
    },
    {
      key: 'showAbout',
      title: 'Culinary Heritage & Story',
      desc: 'Narrative about charcoal slow-cooking, clay tandoors, and heirloom spices.',
    },
    {
      key: 'showGallery',
      title: 'Visual Photo Gallery',
      desc: 'Grid showing royal dishes, dining room ambience, and live kitchen photos.',
    },
    {
      key: 'showTestimonials',
      title: 'Diner Testimonials & Ratings',
      desc: 'Real quotes, ratings, and recommended dishes from happy patrons.',
    },
    {
      key: 'showGoogleReviews',
      title: 'Google Maps Reviews Button',
      desc: 'Direct link allowing diners to inspect verified Google Local reviews.',
    },
    {
      key: 'showLocationHours',
      title: 'Weekly Opening Hours & Address',
      desc: 'Interactive schedule table for every day of the week, plus map directions.',
    },
    {
      key: 'showCateringInquiry',
      title: 'Party & Catering Inquiries',
      desc: 'Lead capture form allowing event organizers to request banquet pricing.',
    },
    {
      key: 'showFaq',
      title: 'Frequently Asked Questions (FAQ)',
      desc: 'Accordion resolving delivery zones, pure veg sanctum, and Halal meat questions.',
    },
    {
      key: 'showFooter',
      title: 'Footer & Legal Policies',
      desc: 'Bottom bar containing copyright, contact links, Privacy Policy, and Terms.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Website Sections Manager</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Turn specific public sections ON or OFF to match your restaurant's current offerings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saved && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{saved ? 'Settings Saved!' : 'Save Sections'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionDefinitions.map((sec) => {
          const isEnabled = sections[sec.key];
          return (
            <div
              key={sec.key}
              onClick={() => toggleSection(sec.key)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 select-none ${
                isEnabled
                  ? 'border-amber-600/60 bg-amber-50/30'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 opacity-60'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-neutral-900">{sec.title}</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-snug">{sec.desc}</p>
              </div>

              {/* Toggle switch */}
              <div
                className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  isEnabled ? 'bg-amber-600' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
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
