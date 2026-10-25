import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

const DEFAULT_CAT_IMAGES: Record<string, string> = {
  'cat-burgers': 'https://preview.themewagon.com/sarab/img/category/2.jpg',
  'cat-pizza': 'https://preview.themewagon.com/sarab/img/category/3.jpg',
  'cat-chicken': 'https://preview.themewagon.com/sarab/img/category/4.jpg',
  'cat-wraps': 'https://preview.themewagon.com/sarab/img/category/5.jpg',
  'cat-desserts': 'https://preview.themewagon.com/sarab/img/category/6.jpg',
  'cat-pasta': 'https://preview.themewagon.com/sarab/img/menu/6.jpg',
};

export const OrderModesBar: React.FC = () => {
  const { data } = useRestaurant();
  const { categories, items } = data;
  const [activeCat, setActiveCat] = useState<string>('all');

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const visibleItemsCount = useMemo(
    () => items.filter((i) => i.stockStatus !== 'hidden').length,
    [items]
  );

  if (!data.websiteSections.showOrderModes) return null;

  const menuContent = data.sectionContents?.menu;

  const handleCategoryClick = (catId: string) => {
    setActiveCat(catId);
    window.dispatchEvent(new CustomEvent('sarab:select-category', { detail: catId }));
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="category" className="py-14 sm:py-20 bg-[#fff8f0] w-full max-w-[100vw] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="slbl">{menuContent?.categoryKicker || 'What We Offer'}</span>
          <h2 className="stitle">
            {menuContent?.categoryTitle ? (
              menuContent.categoryTitle
            ) : (
              <>
                Browse by <span>Category</span>
              </>
            )}
          </h2>
          <div className="sline" />
          <p className="text-[#777777] text-sm sm:text-[15px] max-w-[480px] mx-auto leading-[1.8]">
            {menuContent?.categorySubtitle ||
              'From sizzling burgers to exotic world cuisines - find your favourite in our menu'}
          </p>
        </div>

        {/* Dynamic Sarab Category Cards (.catcard) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* All Items Card */}
          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`group bg-white rounded-[15px] py-5 px-3.5 text-center cursor-pointer transition-all duration-300 border-2 ${
              activeCat === 'all'
                ? '-translate-y-1.5 shadow-[0_14px_38px_rgba(232,40,26,0.14)] border-[#e8281a]'
                : 'border-transparent shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 hover:shadow-[0_14px_38px_rgba(232,40,26,0.14)] hover:border-[#e8281a]'
            }`}
          >
            <img
              src="https://preview.themewagon.com/sarab/img/category/1.jpg"
              alt="All Items"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
              }}
              className="w-[82px] h-[82px] rounded-full object-cover mx-auto mb-3 block transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            />
            <div className="text-[14px] font-semibold text-[#1a1a1a] mb-0.5">All Items</div>
            <div className="text-xs text-[#999999]">{visibleItemsCount} dishes</div>
          </button>

          {/* Dynamic Categories from Database */}
          {activeCategories.map((cat) => {
            const isActive = activeCat === cat.id;
            const liveCount = items.filter(
              (i) => i.categoryId === cat.id && i.stockStatus !== 'hidden'
            ).length;
            const imgSrc =
              cat.imageUrl && cat.imageUrl.trim() !== ''
                ? cat.imageUrl
                : DEFAULT_CAT_IMAGES[cat.id] ||
                  'https://preview.themewagon.com/sarab/img/category/2.jpg';

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`group bg-white rounded-[15px] py-5 px-3.5 text-center cursor-pointer transition-all duration-300 border-2 ${
                  isActive
                    ? '-translate-y-1.5 shadow-[0_14px_38px_rgba(232,40,26,0.14)] border-[#e8281a]'
                    : 'border-transparent shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 hover:shadow-[0_14px_38px_rgba(232,40,26,0.14)] hover:border-[#e8281a]'
                }`}
              >
                <img
                  src={imgSrc}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80';
                  }}
                  className="w-[82px] h-[82px] rounded-full object-cover mx-auto mb-3 block transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                />
                <div className="text-[14px] font-semibold text-[#1a1a1a] mb-0.5 truncate">
                  {cat.name}
                </div>
                <div className="text-xs text-[#999999]">
                  {cat.itemCountLabel || `${liveCount} dishes`}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
