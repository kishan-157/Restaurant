import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { MenuItem } from '../../types';
import { VegNonVegBadge, SpiceLevelIndicator } from '../common/DietaryBadge';
import { FoodVisual } from '../common/FoodVisual';
import { ItemCustomizeModal } from './ItemCustomizeModal';

export const MenuSection: React.FC = () => {
  const { data } = useRestaurant();
  const { profile, categories, items, variants } = data;
  const { cart, addToCart, updateQuantity, setCustomizingItem, customizingItem } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg' | 'bestsellers'>('all');

  // Active categories
  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Hide items marked hidden
      if (item.stockStatus === 'hidden') return false;

      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      // Diet filter
      if (dietFilter === 'veg' && !item.isVeg) return false;
      if (dietFilter === 'non-veg' && item.isVeg) return false;
      if (dietFilter === 'bestsellers' && !item.isBestseller) return false;

      return true;
    });
  }, [items, selectedCategory, searchQuery, dietFilter]);

  // Handle Add Click
  const handleItemClick = (item: MenuItem) => {
    if (item.stockStatus !== 'available') return;

    // Check if this item has variants or addons
    const itemVariants = variants.filter((v) => v.menuItemId === item.id && v.isAvailable);
    const hasVariantsOrAddons = itemVariants.length > 0 || item.hasAddons || item.hasVariants;

    if (hasVariantsOrAddons) {
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  };

  // Group items by category if "all" is selected and no search
  const categoriesToShow = useMemo(() => {
    if (selectedCategory !== 'all') {
      return activeCategories.filter((c) => c.id === selectedCategory);
    }
    return activeCategories;
  }, [selectedCategory, activeCategories]);

  return (
    <section id="menu" className="py-12 lg:py-16 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Freshly Prepared to Order
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-neutral-900 mt-1">
            Our Digital Menu
          </h2>
          <p className="text-sm text-neutral-600 mt-2">
            Select dishes, pick your preferred portion size, customize add-ons, and order directly on WhatsApp.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs mb-8 space-y-4">
          {/* Top row: Search and Diet Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes (e.g. Biryani, Butter Chicken, Naan)..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* Diet Segmented Controls (Button tabs) */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setDietFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  dietFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Dishes
              </button>
              <button
                type="button"
                onClick={() => setDietFilter('veg')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  dietFilter === 'veg'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Pure Veg</span>
              </button>
              <button
                type="button"
                onClick={() => setDietFilter('non-veg')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  dietFilter === 'non-veg'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-700" />
                <span>Non-Veg</span>
              </button>
              <button
                type="button"
                onClick={() => setDietFilter('bestsellers')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  dietFilter === 'bestsellers'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Bestsellers
              </button>
            </div>
          </div>

          {/* Bottom row: Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-neutral-100 pt-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Categories
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Listings */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800">No dishes match your filter</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Try adjusting your search keywords or switching back to "All Dishes" to view our complete selection.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setDietFilter('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {categoriesToShow.map((cat) => {
              const catItems = filteredItems.filter((i) => i.categoryId === cat.id);
              if (catItems.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-5">
                  {/* Category Title & description */}
                  <div className="border-b border-neutral-200 pb-2">
                    <h3 className="text-xl font-bold font-heading text-neutral-900">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">{cat.description}</p>
                    )}
                  </div>

                  {/* 3-Column Product Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catItems.map((item) => {
                      const itemVariants = variants.filter(
                        (v) => v.menuItemId === item.id && v.isAvailable
                      );
                      const hasOptions = itemVariants.length > 0 || item.hasAddons || item.hasVariants;
                      const isUnavailable = item.stockStatus !== 'available';

                      // Find how many instances of this item are currently in the cart
                      const inCartMatches = cart.filter((c) => c.item.id === item.id);
                      const totalInCart = inCartMatches.reduce((s, c) => s + c.quantity, 0);

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
                        >
                          {/* Image Container with Styled Fallback */}
                          <div className="relative">
                            <FoodVisual
                              imageUrl={item.imageUrl}
                              title={item.name}
                              category={cat.name}
                              isVeg={item.isVeg}
                              aspectRatio="4:3"
                              className="w-full h-44"
                            />

                            {/* Badges on visual */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                              <VegNonVegBadge isVeg={item.isVeg} />
                              {item.isBestseller && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                                  Bestseller
                                </span>
                              )}
                            </div>

                            {/* Stock status overlay if not available */}
                            {isUnavailable && (
                              <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-3 text-center z-10">
                                <span className="text-xs font-bold uppercase tracking-wider text-white bg-red-600/90 px-3 py-1 rounded-md">
                                  {item.stockStatus === 'out_of_stock'
                                    ? 'Sold Out for Today'
                                    : 'Temporarily Unavailable'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="text-base font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
                                  {item.name}
                                </h4>
                                <SpiceLevelIndicator level={item.spiceLevel} />
                              </div>

                              {item.portionInfo && (
                                <p className="text-[11px] text-neutral-500 font-medium mb-1.5">
                                  {item.portionInfo}
                                </p>
                              )}

                              {item.description && (
                                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Price & Action Row */}
                            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-bold text-neutral-900 tabular-nums">
                                  {profile.currencySymbol}
                                  {item.price.toFixed(2)}
                                </span>
                                {itemVariants.length > 0 && (
                                  <span className="text-[11px] text-neutral-400 block -mt-0.5">
                                    onwards
                                  </span>
                                )}
                              </div>

                              {/* Button control */}
                              {isUnavailable ? (
                                <span className="text-xs font-medium text-neutral-400 italic">
                                  Unavailable
                                </span>
                              ) : totalInCart > 0 && !hasOptions ? (
                                /* Quick Stepper if simple item in cart */
                                <div className="flex items-center border border-amber-600 rounded-lg bg-amber-50/60 p-0.5">
                                  <button
                                    onClick={() => updateQuantity(inCartMatches[0].cartItemId, -1)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-amber-800 hover:bg-amber-100"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-bold tabular-nums text-amber-900">
                                    {totalInCart}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(inCartMatches[0].cartItemId, 1)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-amber-800 hover:bg-amber-100"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleItemClick(item)}
                                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs ${
                                    hasOptions
                                      ? 'bg-white border border-neutral-300 text-neutral-800 hover:border-amber-600 hover:text-amber-800 hover:bg-amber-50/50'
                                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                                  }`}
                                >
                                  {hasOptions ? (
                                    <>
                                      <span>Customize</span>
                                      <SlidersHorizontal className="w-3 h-3 text-neutral-400 ml-0.5" />
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Customizer Modal */}
      {customizingItem && (
        <ItemCustomizeModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
        />
      )}
    </section>
  );
};
