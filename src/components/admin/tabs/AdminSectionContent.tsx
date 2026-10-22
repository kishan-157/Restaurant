import React, { useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  MessageSquareQuote,
  ChefHat,
  History,
  BookOpen,
  Flame,
  Megaphone,
  Tag,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import {
  SectionContents,
  Testimonial,
  FAQItem,
  ChefProfile,
  TimelineEvent,
  BlogPostItem,
  SpecialOffer,
  HighlightItem,
} from '../../../types';

interface AdminSectionContentProps {
  showToast?: (msg: string) => void;
}

export const AdminSectionContent: React.FC<AdminSectionContentProps> = ({ showToast }) => {
  const {
    data,
    updateSectionContents,
    saveTestimonial,
    deleteTestimonial,
    saveFAQ,
    deleteFAQ,
    saveChef,
    deleteChef,
    saveTimelineEvent,
    deleteTimelineEvent,
    saveBlogPost,
    deleteBlogPost,
    saveOffer,
    deleteOffer,
  } = useRestaurant();

  const toast = (msg: string) => {
    if (showToast) showToast(msg);
  };

  const [contents, setContents] = useState<SectionContents>(() =>
    JSON.parse(JSON.stringify(data.sectionContents))
  );

  const [activeEditorTab, setActiveEditorTab] = useState<
    'hero' | 'about' | 'special' | 'coupons' | 'chefs' | 'timeline' | 'blog' | 'reviews' | 'faqs' | 'headings'
  >('hero');

  // New Testimonial State
  const [newRevAuthor, setNewRevAuthor] = useState('');
  const [newRevSource, setNewRevSource] = useState('Verified Diner');
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevText, setNewRevText] = useState('');
  const [newRevDish, setNewRevDish] = useState('');

  // New FAQ State
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // New Offer / Coupon State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [offerBadge, setOfferBadge] = useState('20% OFF');
  const [offerDesc, setOfferDesc] = useState('');

  // New Chef State
  const [chefName, setChefName] = useState('');
  const [chefRole, setChefRole] = useState('Master Grill Chef');
  const [chefExp, setChefExp] = useState('12+ Years Experience');
  const [chefImage, setChefImage] = useState(
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80'
  );

  // New Timeline Event State
  const [tlYear, setTlYear] = useState('2025');
  const [tlTitle, setTlTitle] = useState('');
  const [tlDesc, setTlDesc] = useState('');

  // New Blog Post State
  const [blogTitle, setBlogTitle] = useState('');
  const [blogTag, setBlogTag] = useState('Culinary Secrets');
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState(
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=700&q=80'
  );

  const handleSaveAllContent = (e: React.FormEvent) => {
    e.preventDefault();
    updateSectionContents(contents);
    toast('Website content saved & synced to Supabase!');
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevAuthor.trim() || !newRevText.trim()) return;
    const item: Testimonial = {
      id: `rev-${Date.now()}`,
      author: newRevAuthor.trim(),
      source: newRevSource.trim() || 'Diner',
      rating: Number(newRevRating) || 5,
      reviewText: newRevText.trim(),
      date: 'Recent',
      dishRecommended: newRevDish.trim() || undefined,
    };
    saveTestimonial(item);
    setNewRevAuthor('');
    setNewRevText('');
    setNewRevDish('');
    toast('Customer review added!');
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const item: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
    };
    saveFAQ(item);
    setNewFaqQ('');
    setNewFaqA('');
    toast('FAQ added!');
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerCode.trim()) return;
    const item: SpecialOffer = {
      id: `offer-${Date.now()}`,
      title: offerTitle.trim(),
      code: offerCode.trim().toUpperCase(),
      discountBadge: offerBadge.trim() || 'SPECIAL',
      description: offerDesc.trim(),
      validUntil: 'Limited Time',
      isActive: true,
    };
    saveOffer(item);
    setOfferTitle('');
    setOfferCode('');
    setOfferDesc('');
    toast('Promo coupon added!');
  };

  const handleAddChef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chefName.trim()) return;
    const item: ChefProfile = {
      id: `chef-${Date.now()}`,
      name: chefName.trim(),
      role: chefRole.trim(),
      experience: chefExp.trim(),
      imageUrl: chefImage.trim(),
    };
    saveChef(item);
    setChefName('');
    toast('Chef profile added!');
  };

  const handleAddTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tlYear.trim() || !tlTitle.trim()) return;
    const item: TimelineEvent = {
      id: `tl-${Date.now()}`,
      year: tlYear.trim(),
      title: tlTitle.trim(),
      description: tlDesc.trim(),
    };
    saveTimelineEvent(item);
    setTlTitle('');
    setTlDesc('');
    toast('Timeline milestone added!');
  };

  const handleAddBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) return;
    const now = new Date();
    const item: BlogPostItem = {
      id: `blog-${Date.now()}`,
      day: String(now.getDate()).padStart(2, '0'),
      month: now.toLocaleDateString('en-US', { month: 'short' }),
      tag: blogTag.trim() || 'Recipes',
      title: blogTitle.trim(),
      author: 'Admin',
      commentsLabel: '0 Comments',
      imageUrl: blogImage.trim(),
      content: blogContent.trim(),
    };
    saveBlogPost(item);
    setBlogTitle('');
    setBlogContent('');
    toast('Blog story published!');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Pills */}
      <div className="bg-white border border-[#e0d6c8] rounded-3xl p-4 flex flex-wrap items-center gap-2">
        {[
          { id: 'hero', label: 'Hero & Marquee', icon: Sparkles },
          { id: 'about', label: 'About Us & Story', icon: Flame },
          { id: 'special', label: 'Deal of the Day & Newsletter', icon: Megaphone },
          { id: 'coupons', label: `Promo Coupons (${data.offers.length})`, icon: Tag },
          { id: 'chefs', label: `Chefs (${(data.chefs || []).length})`, icon: ChefHat },
          { id: 'timeline', label: `History Timeline (${(data.historyTimeline || []).length})`, icon: History },
          { id: 'blog', label: `Blog Stories (${(data.blogPosts || []).length})`, icon: BookOpen },
          { id: 'reviews', label: `Reviews (${data.testimonials.length})`, icon: MessageSquareQuote },
          { id: 'faqs', label: `FAQs (${data.faqs.length})`, icon: HelpCircle },
          { id: 'headings', label: 'Section Titles', icon: Save },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeEditorTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEditorTab(tab.id as typeof activeEditorTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[#e8281a] text-white shadow-sm'
                  : 'bg-[#fff8f0] text-[#5a524c] hover:bg-[#f3e9dc]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. HERO & MARQUEE EDITOR */}
      {activeEditorTab === 'hero' && (
        <form onSubmit={handleSaveAllContent} className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0e8dc] pb-4">
            <div>
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Hero Banner, Floating Badges, Stats & Marquee Ticker
              </h3>
              <p className="text-xs text-[#7a6e65]">
                Customize every word, stat counter, floating badge, and scrolling marquee item in the top Hero section.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Hero & Marquee</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Top Kicker Badge</label>
              <input
                type="text"
                value={contents.hero.kicker}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, kicker: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Background Watermark Word</label>
              <input
                type="text"
                value={contents.hero.watermarkText || 'SARAB'}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, watermarkText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Headline Prefix</label>
              <input
                type="text"
                value={contents.hero.titlePrefix || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, titlePrefix: e.target.value },
                  })
                }
                placeholder="Where Every"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Headline Highlighted Italic Word (Crimson Red)
              </label>
              <input
                type="text"
                value={contents.hero.titleHighlight || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, titleHighlight: e.target.value },
                  })
                }
                placeholder="Flavor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Headline Suffix</label>
              <input
                type="text"
                value={contents.hero.titleSuffix || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, titleSuffix: e.target.value },
                  })
                }
                placeholder="Tells A Story"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Primary CTA Button Text</label>
              <input
                type="text"
                value={contents.hero.primaryButtonText}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, primaryButtonText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Hero Description</label>
              <textarea
                rows={2}
                value={contents.hero.description}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: { ...contents.hero, description: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Scrolling Marquee Ticker Items (Comma-separated)
              </label>
              <input
                type="text"
                value={(contents.hero.marqueeItems || []).join(', ')}
                onChange={e =>
                  setContents({
                    ...contents,
                    hero: {
                      ...contents.hero,
                      marqueeItems: e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
                placeholder="Fresh Burgers, Wood-Fired Pizza, Crispy Chicken, Hot Delivery..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
          </div>

          {/* 4 Hero Stats */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7a6e65] mb-2">
              Hero Trust Stats (4 Counters)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {contents.hero.highlights.map((st: HighlightItem, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
                  <input
                    type="text"
                    value={st.title}
                    onChange={e => {
                      const updated = [...contents.hero.highlights];
                      updated[idx] = { ...st, title: e.target.value };
                      setContents({
                        ...contents,
                        hero: { ...contents.hero, highlights: updated },
                      });
                    }}
                    placeholder="Value (e.g. 850+)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={st.label}
                    onChange={e => {
                      const updated = [...contents.hero.highlights];
                      updated[idx] = { ...st, label: e.target.value };
                      setContents({
                        ...contents,
                        hero: { ...contents.hero, highlights: updated },
                      });
                    }}
                    placeholder="Label (e.g. Daily Orders)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* 2. ABOUT US EDITOR */}
      {activeEditorTab === 'about' && (
        <form onSubmit={handleSaveAllContent} className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0e8dc] pb-4">
            <div>
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                About Us Story, Photos & 4 Feature Boxes
              </h3>
              <p className="text-xs text-[#7a6e65]">
                Customize your culinary heritage story, experience badge, overlapping images, and 4 highlight boxes.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save About Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Section Kicker</label>
              <input
                type="text"
                value={contents.about.kicker}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, kicker: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Main Title</label>
              <input
                type="text"
                value={contents.about.title}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, title: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Experience Years Number</label>
              <input
                type="text"
                value={contents.about.experienceYears || '12+'}
                onChange={e =>
                  setContents({
                    ...contents,
                    about: { ...contents.about, experienceYears: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Experience Badge Label</label>
              <input
                type="text"
                value={contents.about.experienceLabel || 'Years of Craft'}
                onChange={e =>
                  setContents({
                    ...contents,
                    about: { ...contents.about, experienceLabel: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Primary Image URL</label>
              <input
                type="text"
                value={contents.about.mainImageUrl || ''}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, mainImageUrl: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Story Narrative</label>
              <textarea
                rows={3}
                value={contents.about.story}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, story: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <label className="block text-[11px] font-bold uppercase text-[#e8281a]">Feature Box 1</label>
              <input
                type="text"
                value={contents.about.box1Title}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, box1Title: e.target.value } })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.about.box1Desc}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, box1Desc: e.target.value } })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <label className="block text-[11px] font-bold uppercase text-[#e8281a]">Feature Box 2</label>
              <input
                type="text"
                value={contents.about.box2Title}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, box2Title: e.target.value } })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.about.box2Desc}
                onChange={e =>
                  setContents({ ...contents, about: { ...contents.about, box2Desc: e.target.value } })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <label className="block text-[11px] font-bold uppercase text-[#e8281a]">Feature Box 3</label>
              <input
                type="text"
                value={contents.about.feature1Title}
                onChange={e =>
                  setContents({
                    ...contents,
                    about: { ...contents.about, feature1Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.about.feature1Desc}
                onChange={e =>
                  setContents({
                    ...contents,
                    about: { ...contents.about, feature1Desc: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <label className="block text-[11px] font-bold uppercase text-[#e8281a]">Feature Box 4</label>
              <input
                type="text"
                value={contents.about.feature2Title}
                onChange={e =>
                  setContents({
                    ...contents,
                    about: { ...contents.about, feature2Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.about.feature2Desc}
                onChange={e =>
                  setContents({
                    ...contents,
                    about: { ...contents.about, feature2Desc: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-xs"
              />
            </div>
          </div>
        </form>
      )}

      {/* 3. SPECIAL DEAL BANNER & NEWSLETTER EDITOR */}
      {activeEditorTab === 'special' && (
        <form onSubmit={handleSaveAllContent} className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0e8dc] pb-4">
            <div>
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Deal of the Day Banner & VIP Newsletter
              </h3>
              <p className="text-xs text-[#7a6e65]">
                Customize the dark split Deal of the Day showcase, pricing, countdown timer, and newsletter strip.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Deal & Newsletter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Deal Badge Text</label>
              <input
                type="text"
                value={contents.specialDeal?.badge || '🔥 Deal of the Day'}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: {
                      ...(contents.specialDeal || {
                        badge: '',
                        titleLine1: '',
                        titleHighlight: '',
                        titleLine2: '',
                        description: '',
                        originalPrice: '$28.99',
                        dealPrice: '$17.99',
                        buttonText: 'Claim Deal Now',
                        imageUrl: '',
                        countdownHours: 5,
                        countdownMinutes: 42,
                        countdownSeconds: 18,
                      }),
                      badge: e.target.value,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Headline Line 1</label>
              <input
                type="text"
                value={contents.specialDeal?.titleLine1 || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: { ...contents.specialDeal!, titleLine1: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Highlighted Gold Word
              </label>
              <input
                type="text"
                value={contents.specialDeal?.titleHighlight || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: { ...contents.specialDeal!, titleHighlight: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Deal Price</label>
              <input
                type="text"
                value={contents.specialDeal?.dealPrice || '$17.99'}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: { ...contents.specialDeal!, dealPrice: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Original Price</label>
              <input
                type="text"
                value={contents.specialDeal?.originalPrice || '$28.99'}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: { ...contents.specialDeal!, originalPrice: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Deal Image URL</label>
              <input
                type="text"
                value={contents.specialDeal?.imageUrl || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: { ...contents.specialDeal!, imageUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Deal Description</label>
              <textarea
                rows={2}
                value={contents.specialDeal?.description || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    specialDeal: { ...contents.specialDeal!, description: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
          </div>

          <div className="border-t border-[#f0e8dc] pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Newsletter Heading</label>
              <input
                type="text"
                value={contents.newsletter?.title || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    newsletter: {
                      ...(contents.newsletter || {
                        kicker: 'VIP Club',
                        title: '',
                        highlightWord: '',
                        subtitle: '',
                        buttonText: 'Subscribe',
                        successMessage: 'Thank you for subscribing!',
                      }),
                      title: e.target.value,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">Newsletter Subtitle</label>
              <input
                type="text"
                value={contents.newsletter?.subtitle || ''}
                onChange={e =>
                  setContents({
                    ...contents,
                    newsletter: { ...contents.newsletter!, subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
              />
            </div>
          </div>
        </form>
      )}

      {/* 4. PROMO COUPONS CRUD */}
      {activeEditorTab === 'coupons' && (
        <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div>
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Promo Coupons & Discount Codes ({data.offers.length})
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Create or manage promo coupons shown below the Deal of the Day banner.
            </p>
          </div>

          <form
            onSubmit={handleAddOffer}
            className="p-5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <input
              type="text"
              placeholder="Offer Title (e.g. Weekend Feast)"
              value={offerTitle}
              onChange={e => setOfferTitle(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Coupon Code (e.g. SARAB20)"
              value={offerCode}
              onChange={e => setOfferCode(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs uppercase"
            />
            <input
              type="text"
              placeholder="Discount Badge (e.g. 20% OFF)"
              value={offerBadge}
              onChange={e => setOfferBadge(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Coupon</span>
            </button>
            <input
              type="text"
              placeholder="Offer Description / Terms"
              value={offerDesc}
              onChange={e => setOfferDesc(e.target.value)}
              className="sm:col-span-4 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.offers.map(offer => (
              <div
                key={offer.id}
                className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8281a] text-white">
                      {offer.discountBadge}
                    </span>
                    <span className="font-bold text-sm text-[#1a1a1a]">{offer.title}</span>
                    <code className="px-2 py-0.5 rounded bg-white border border-[#e0d6c8] text-xs font-bold text-[#e8281a]">
                      {offer.code}
                    </code>
                  </div>
                  <p className="text-xs text-[#7a6e65] mt-1">{offer.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteOffer(offer.id);
                    toast('Coupon deleted.');
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CHEFS CRUD */}
      {activeEditorTab === 'chefs' && (
        <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div>
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Meet Our Expert Chefs ({(data.chefs || []).length})
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Add, edit, or remove chef cards displayed in the Chefs section of the website.
            </p>
          </div>

          <form
            onSubmit={handleAddChef}
            className="p-5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <input
              type="text"
              placeholder="Chef Full Name"
              value={chefName}
              onChange={e => setChefName(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Role (e.g. Executive Head Chef)"
              value={chefRole}
              onChange={e => setChefRole(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Experience (e.g. 15+ Years)"
              value={chefExp}
              onChange={e => setChefExp(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chef</span>
            </button>
            <input
              type="text"
              placeholder="Photo URL"
              value={chefImage}
              onChange={e => setChefImage(e.target.value)}
              className="sm:col-span-4 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data.chefs || []).map(chef => (
              <div
                key={chef.id}
                className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={chef.imageUrl}
                    alt={chef.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#e0d6c8]"
                  />
                  <div>
                    <div className="font-bold text-sm text-[#1a1a1a]">{chef.name}</div>
                    <div className="text-xs text-[#e8281a] font-semibold">{chef.role}</div>
                    <div className="text-[11px] text-[#7a6e65]">{chef.experience}</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      deleteChef(chef.id);
                      toast('Chef removed.');
                    }}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. HISTORY TIMELINE CRUD */}
      {activeEditorTab === 'timeline' && (
        <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div>
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Restaurant History Timeline ({(data.historyTimeline || []).length})
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Customize the milestone cards in the "Our Culinary Journey" timeline section.
            </p>
          </div>

          <form
            onSubmit={handleAddTimeline}
            className="p-5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <input
              type="text"
              placeholder="Year (e.g. 2012)"
              value={tlYear}
              onChange={e => setTlYear(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Milestone Title"
              value={tlTitle}
              onChange={e => setTlTitle(e.target.value)}
              required
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Milestone</span>
            </button>
            <input
              type="text"
              placeholder="Milestone Description"
              value={tlDesc}
              onChange={e => setTlDesc(e.target.value)}
              required
              className="sm:col-span-4 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.historyTimeline || []).map(ev => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-black text-base text-[#e8281a]">{ev.year}</span>
                  <div className="font-bold text-sm text-[#1a1a1a] mt-0.5">{ev.title}</div>
                  <p className="text-xs text-[#7a6e65] mt-1">{ev.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteTimelineEvent(ev.id);
                    toast('Milestone deleted.');
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. BLOG STORIES CRUD */}
      {activeEditorTab === 'blog' && (
        <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div>
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Latest Food Stories & Blog ({(data.blogPosts || []).length})
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Publish or edit culinary articles and news cards shown on the website.
            </p>
          </div>

          <form
            onSubmit={handleAddBlog}
            className="p-5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <input
              type="text"
              placeholder="Article Title"
              value={blogTitle}
              onChange={e => setBlogTitle(e.target.value)}
              required
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Tag (e.g. Recipes)"
              value={blogTag}
              onChange={e => setBlogTag(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Cover Photo URL"
              value={blogImage}
              onChange={e => setBlogImage(e.target.value)}
              className="sm:col-span-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Article Summary / Content"
              value={blogContent}
              onChange={e => setBlogContent(e.target.value)}
              required
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Story</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data.blogPosts || []).map(post => (
              <div
                key={post.id}
                className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex flex-col justify-between gap-3"
              >
                <div>
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-32 rounded-xl object-cover mb-3"
                  />
                  <span className="text-[10px] font-bold uppercase text-[#e8281a]">
                    {post.tag} • {post.day} {post.month}
                  </span>
                  <h4 className="font-bold text-sm text-[#1a1a1a] mt-1">{post.title}</h4>
                  <p className="text-xs text-[#7a6e65] mt-1 line-clamp-2">{post.content}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      deleteBlogPost(post.id);
                      toast('Blog post deleted.');
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. REVIEWS CRUD */}
      {activeEditorTab === 'reviews' && (
        <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div>
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Customer Testimonials ({data.testimonials.length})
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Add or remove customer reviews displayed on the public website.
            </p>
          </div>

          <form
            onSubmit={handleAddReview}
            className="p-5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <input
              type="text"
              placeholder="Customer Name"
              value={newRevAuthor}
              onChange={e => setNewRevAuthor(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Source / Badge"
              value={newRevSource}
              onChange={e => setNewRevSource(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Dish Ordered"
              value={newRevDish}
              onChange={e => setNewRevDish(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <select
              value={newRevRating}
              onChange={e => setNewRevRating(Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            >
              <option value={5}>5 Stars ★★★★★</option>
              <option value={4}>4 Stars ★★★★</option>
            </select>
            <input
              type="text"
              placeholder="Customer review quote..."
              value={newRevText}
              onChange={e => setNewRevText(e.target.value)}
              required
              className="sm:col-span-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Review</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.testimonials.map(rev => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-xs text-[#1a1a1a]">
                    {rev.author} <span className="text-[#7a6e65] font-normal">({rev.source})</span>
                  </div>
                  <p className="text-xs text-[#5a524c] mt-1">"{rev.reviewText}"</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteTestimonial(rev.id);
                    toast('Review deleted.');
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. FAQS CRUD */}
      {activeEditorTab === 'faqs' && (
        <div className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div>
            <h3
              className="text-xl font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Frequently Asked Questions ({data.faqs.length})
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Manage the expandable FAQ accordion items on your website.
            </p>
          </div>

          <form
            onSubmit={handleAddFaq}
            className="p-5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <input
              type="text"
              placeholder="Question"
              value={newFaqQ}
              onChange={e => setNewFaqQ(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <input
              type="text"
              placeholder="Answer"
              value={newFaqA}
              onChange={e => setNewFaqA(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#e0d6c8] text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e8281a] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </button>
          </form>

          <div className="space-y-2.5">
            {data.faqs.map(faq => (
              <div
                key={faq.id}
                className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-xs text-[#1a1a1a]">{faq.question}</div>
                  <p className="text-xs text-[#7a6e65] mt-1">{faq.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteFAQ(faq.id);
                    toast('FAQ removed.');
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. SECTION HEADINGS EDITOR */}
      {activeEditorTab === 'headings' && (
        <form onSubmit={handleSaveAllContent} className="bg-white border border-[#e0d6c8] rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0e8dc] pb-4">
            <div>
              <h3
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Section Headings & Subtitles
              </h3>
              <p className="text-xs text-[#7a6e65]">
                Customize the kickers, titles, and subtitles of Menu, Offers, Reviews, Location, and FAQs.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-xs shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save All Headings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Menu Heading */}
            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e8281a]">Menu Section</span>
              <input
                type="text"
                value={contents.menu.kicker}
                onChange={e =>
                  setContents({ ...contents, menu: { ...contents.menu, kicker: e.target.value } })
                }
                placeholder="Kicker"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
              />
              <input
                type="text"
                value={contents.menu.title}
                onChange={e =>
                  setContents({ ...contents, menu: { ...contents.menu, title: e.target.value } })
                }
                placeholder="Title"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.menu.subtitle}
                onChange={e =>
                  setContents({ ...contents, menu: { ...contents.menu, subtitle: e.target.value } })
                }
                placeholder="Subtitle"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
              />
            </div>

            {/* Offers Heading */}
            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e8281a]">Offers Section</span>
              <input
                type="text"
                value={contents.offers.kicker}
                onChange={e =>
                  setContents({ ...contents, offers: { ...contents.offers, kicker: e.target.value } })
                }
                placeholder="Kicker"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
              />
              <input
                type="text"
                value={contents.offers.title}
                onChange={e =>
                  setContents({ ...contents, offers: { ...contents.offers, title: e.target.value } })
                }
                placeholder="Title"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.offers.subtitle}
                onChange={e =>
                  setContents({ ...contents, offers: { ...contents.offers, subtitle: e.target.value } })
                }
                placeholder="Subtitle"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
              />
            </div>

            {/* Reviews Heading */}
            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e8281a]">Reviews Section</span>
              <input
                type="text"
                value={contents.reviews.kicker}
                onChange={e =>
                  setContents({ ...contents, reviews: { ...contents.reviews, kicker: e.target.value } })
                }
                placeholder="Kicker"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
              />
              <input
                type="text"
                value={contents.reviews.title}
                onChange={e =>
                  setContents({ ...contents, reviews: { ...contents.reviews, title: e.target.value } })
                }
                placeholder="Title"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold"
              />
            </div>

            {/* Location Heading */}
            <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e8281a]">Location & FAQ</span>
              <input
                type="text"
                value={contents.location.title}
                onChange={e =>
                  setContents({ ...contents, location: { ...contents.location, title: e.target.value } })
                }
                placeholder="Location Title"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold"
              />
              <input
                type="text"
                value={contents.faq.title}
                onChange={e =>
                  setContents({ ...contents, faq: { ...contents.faq, title: e.target.value } })
                }
                placeholder="FAQ Title"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
