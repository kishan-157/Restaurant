import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Heart,
  Star,
  Flame,
  Clock,
  ShoppingCart,
  X,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';
import { MenuItem } from '../../types';
import { ItemCustomizeModal } from './ItemCustomizeModal';

const FALLBACK_IMAGES: Record<string, string> = {
  'cat-burgers': 'https://preview.themewagon.com/sarab/img/menu/1.jpg',
  'cat-pizza': 'https://preview.themewagon.com/sarab/img/menu/2.jpg',
  'cat-chicken': 'https://preview.themewagon.com/sarab/img/menu/3.jpg',
  'cat-wraps': 'https://preview.themewagon.com/sarab/img/menu/4.jpg',
  'cat-desserts': 'https://preview.themewagon.com/sarab/img/menu/5.jpg',
  'cat-pasta': 'https://preview.themewagon.com/sarab/img/menu/6.jpg',
};

export const MenuSection: React.FC = () => {
  const { data } = useRestaurant();
  const { profile, categories, items, variants, websiteSections } = data;
  const { addToCart, setCustomizingItem, customizingItem, setIsCartOpen } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedCategory(customEvent.detail);
      }
    };
    window.addEventListener('sarab:select-category', handler);
    return () => window.removeEventListener('sarab:select-category', handler);
  }, []);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.stockStatus === 'hidden') return false;
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  if (!websiteSections.showFullMenu && !websiteSections.showFeaturedMenu) return null;

  const toggleHeart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openDishPopup = (item: MenuItem) => {
    setDetailItem(item);
    setDetailQty(1);
  };

  const handleQuickAddOrCustomize = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (item.stockStatus !== 'available') return;
    openDishPopup(item);
  };

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : 'Special';
  };

  const getBadgeConfig = (item: MenuItem, idx: number) => {
    if (item.tags?.includes('New')) {
      return { text: 'New', bg: 'bg-[#2d6a4f] text-white' };
    }
    if (item.tags?.includes('Hot')) {
      return { text: 'Hot', bg: 'bg-[#f6a623] text-[#1a1a1a]' };
    }
    if (item.isBestseller) {
      return {
        text: idx === 0 ? '20% Off' : 'Best Seller',
        bg: 'bg-[#e8281a] text-white',
      };
    }
    return null;
  };

  const menuContent = data.sectionContents?.menu || DEFAULT_RESTAURANT_DATA.sectionContents!.menu;

  return (
    <section id="menu" className="py-18 sm:py-22 bg-[#f9f5f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sarab Section Header */}
        <div className="text-center mb-10">
          <span className="slbl">{menuContent.kicker || "What's Cooking"}</span>
          <h2 className="stitle">
            {menuContent.title ? (
              menuContent.title
            ) : (
              <>
                Our Delicious <span>Menu</span>
              </>
            )}
          </h2>
          <div className="sline" />
          {menuContent.subtitle && (
            <p className="text-[#777777] text-sm max-w-lg mx-auto mt-2">{menuContent.subtitle}</p>
          )}
        </div>

        {/* Sarab Filter Buttons & Search Row (Touch-Friendly on Mobile) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-9">
          {/* Category Filter Pills (.mfilt) */}
          <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap justify-start md:justify-center">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#e8281a] text-white shadow-[0_6px_18px_rgba(232,40,26,0.3)]'
                  : 'bg-white text-[#555555] hover:bg-[#e8281a]/10 hover:text-[#e8281a] shadow-xs'
              }`}
            >
              All
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#e8281a] text-white shadow-[0_6px_18px_rgba(232,40,26,0.3)]'
                    : 'bg-white text-[#555555] hover:bg-[#e8281a]/10 hover:text-[#e8281a] shadow-xs'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Inline Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#999999] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter dishes..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-neutral-200 text-xs text-[#1a1a1a] placeholder-[#999999] focus:outline-none focus:border-[#e8281a]"
            />
          </div>
        </div>

        {/* Sarab 3-Column Menu Grid (#mgrid) */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xs p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#fff8f0] mx-auto flex items-center justify-center text-[#e8281a]">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[#1a1a1a]">
              No dishes match your filter
            </h3>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-red text-xs py-2.5 px-6"
            >
              Show All Dishes
            </button>
          </div>
        ) : (
          <div id="mgrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => {
              const badge = getBadgeConfig(item, idx);
              const isLiked = !!likedIds[item.id];
              const isUnavailable = item.stockStatus !== 'available';
              const catName = getCategoryName(item.categoryId);
              const oldPriceStr = item.oldPrice
                ? item.oldPrice.toFixed(2)
                : (item.price * 1.25).toFixed(2);
              const imgSrc =
                item.imageUrl && item.imageUrl.trim() !== ''
                  ? item.imageUrl
                  : FALLBACK_IMAGES[item.categoryId] ||
                    'https://preview.themewagon.com/sarab/img/menu/1.jpg';

              return (
                <div
                  key={item.id}
                  onClick={() => openDishPopup(item)}
                  className="mcard group bg-white rounded-[18px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.14)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Image Box (.mimg) */}
                  <div className="relative h-[215px] bg-[#fef0dc] overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Top-Left Badge */}
                    {badge && (
                      <div
                        className={`absolute top-3.5 left-3.5 rounded-[7px] px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-xs ${badge.bg}`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        <span>{badge.text}</span>
                      </div>
                    )}

                    {/* Top-Right Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleHeart(e, item.id)}
                      className={`absolute top-3.5 right-3.5 w-[33px] h-[33px] rounded-full bg-white flex items-center justify-center shadow-[0_2px_9px_rgba(0,0,0,0.1)] transition-all hover:scale-115 cursor-pointer ${
                        isLiked ? 'text-[#e8281a]' : 'text-[#cccccc] hover:text-[#e8281a]'
                      }`}
                      aria-label="Favorite Dish"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#e8281a]' : ''}`} />
                    </button>

                    {/* Sold Out Overlay */}
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                        <span className="bg-[#e8281a] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                          Sold Out Today
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body (.mbody) */}
                  <div className="p-[18px] flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-[#f6a623] uppercase tracking-[1px] mb-1">
                        {catName}
                      </div>
                      <h3 className="font-heading text-[17px] font-bold text-[#1a1a1a] mb-1 group-hover:text-[#e8281a] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#888888] leading-[1.55] mb-3.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Footer (.mfoot) */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="font-heading text-xl font-extrabold text-[#e8281a]">
                          {profile.currencySymbol}
                          {item.price.toFixed(2)}
                          <small className="text-xs font-normal text-[#cccccc] line-through ml-1.5 font-poppins">
                            {profile.currencySymbol}
                            {oldPriceStr}
                          </small>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#f6a623] mt-0.5">
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <Star key={starIdx} className="w-3.5 h-3.5 fill-[#f6a623]" />
                          ))}
                          <span className="text-[#999999] text-[11px] ml-0.5">
                            ({item.reviewsCount ?? 128})
                          </span>
                        </div>
                      </div>

                      {/* Circular Red Plus Button (.madd) */}
                      <button
                        type="button"
                        disabled={isUnavailable}
                        onClick={(e) => handleQuickAddOrCustomize(e, item)}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e8281a] to-[#c01e12] text-white flex items-center justify-center shadow-[0_4px_11px_rgba(232,40,26,0.28)] hover:scale-115 hover:rotate-90 transition-all duration-300 cursor-pointer disabled:opacity-40"
                        title="View Dish Details & Add to Cart"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== SARAB DISH DETAIL POPUP (#menuPop) ===================== */}
      {detailItem && (
        <div
          id="menuPop"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setDetailItem(null)}
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-[#e8281a] text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Dish Popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Dish Image */}
            <div className="h-56 bg-[#fef0dc] overflow-hidden">
              <img
                src={
                  detailItem.imageUrl ||
                  FALLBACK_IMAGES[detailItem.categoryId] ||
                  'https://preview.themewagon.com/sarab/img/menu/1.jpg'
                }
                alt={detailItem.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Dish Details Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f6a623] block">
                    {getCategoryName(detailItem.categoryId)}
                  </span>
                  <h3 className="font-heading text-2xl font-black text-[#1a1a1a]">
                    {detailItem.name}
                  </h3>
                </div>
                <div className="font-heading text-2xl font-black text-[#e8281a] shrink-0">
                  {profile.currencySymbol}
                  {(detailItem.price * detailQty).toFixed(2)}
                </div>
              </div>

              {/* Stars & Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#777777]">
                <span className="inline-flex items-center gap-1 text-[#f6a623] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" /> {detailItem.rating ?? 4.9} (
                  {detailItem.reviewsCount ?? 128} reviews)
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#e8281a]" />{' '}
                  {detailItem.calories || '580 kcal'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />{' '}
                  {detailItem.prepTime || '15 mins prep'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                {detailItem.description}
              </p>

              {/* Tags */}
              {detailItem.tags && detailItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {detailItem.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-[#fff8f0] border border-[#fef0dc] text-[11px] font-semibold text-[#e8281a]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Quantity Stepper & Add to Cart */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3 bg-[#f9f5f0] rounded-full px-3 py-1.5 border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8281a] hover:text-white transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm text-[#1a1a1a] w-5 text-center tabular-nums">
                    {detailQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailQty((q) => q + 1)}
                    className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8281a] hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  {variants.some((v) => v.menuItemId === detailItem.id && v.isAvailable) && (
                    <button
                      type="button"
                      onClick={() => {
                        const itemToCustomize = detailItem;
                        setDetailItem(null);
                        setCustomizingItem(itemToCustomize);
                      }}
                      className="px-4 py-3 rounded-full border border-[#e8281a] text-[#e8281a] hover:bg-[#fff8f0] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Options
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      for (let i = 0; i < detailQty; i++) {
                        addToCart(detailItem);
                      }
                      setDetailItem(null);
                      setIsCartOpen(true);
                    }}
                    className="btn-red flex-1 justify-center py-3 text-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Variant/Addon Customizer Modal */}
      {customizingItem && (
        <ItemCustomizeModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
        />
      )}
    </section>
  );
};
