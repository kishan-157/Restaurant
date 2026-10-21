import React, { useState } from 'react';
import { Plus, Edit2, Copy, Trash2, Search, SlidersHorizontal, X, Check } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { MenuItem, StockStatus } from '../../../types';
import { VegNonVegBadge, SpiceLevelIndicator } from '../../common/DietaryBadge';

export const AdminMenuItems: React.FC = () => {
  const { data, saveItem, deleteItem } = useRestaurant();
  const { items, categories, profile } = data;

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCatId, setFormCatId] = useState(categories[0]?.id || '');
  const [formPrice, setFormPrice] = useState<number>(250);
  const [formDesc, setFormDesc] = useState('');
  const [formPortion, setFormPortion] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsBestseller, setFormIsBestseller] = useState(false);
  const [formSpiceLevel, setFormSpiceLevel] = useState<0 | 1 | 2 | 3>(1);
  const [formStockStatus, setFormStockStatus] = useState<StockStatus>('available');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formHasVariants, setFormHasVariants] = useState(false);
  const [formHasAddons, setFormHasAddons] = useState(false);

  const startCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setFormName('');
    setFormCatId(categories[0]?.id || '');
    setFormPrice(250);
    setFormDesc('');
    setFormPortion('');
    setFormIsVeg(true);
    setFormIsBestseller(false);
    setFormSpiceLevel(1);
    setFormStockStatus('available');
    setFormImageUrl('');
    setFormHasVariants(false);
    setFormHasAddons(false);
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setFormName(item.name);
    setFormCatId(item.categoryId);
    setFormPrice(item.price);
    setFormDesc(item.description);
    setFormPortion(item.portionInfo || '');
    setFormIsVeg(item.isVeg);
    setFormIsBestseller(item.isBestseller);
    setFormSpiceLevel(item.spiceLevel);
    setFormStockStatus(item.stockStatus);
    setFormImageUrl(item.imageUrl || '');
    setFormHasVariants(item.hasVariants);
    setFormHasAddons(item.hasAddons);
  };

  const duplicateItem = (item: MenuItem) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Copy)`,
      displayOrder: items.length + 1,
    };
    saveItem(newItem);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCatId) return;

    const id = editingItem ? editingItem.id : `item-${Date.now()}`;
    const displayOrder = editingItem ? editingItem.displayOrder : items.length + 1;

    saveItem({
      id,
      categoryId: formCatId,
      name: formName.trim(),
      description: formDesc.trim(),
      price: Number(formPrice),
      portionInfo: formPortion.trim(),
      isVeg: formIsVeg,
      isBestseller: formIsBestseller,
      spiceLevel: formSpiceLevel,
      stockStatus: formStockStatus,
      imageUrl: formImageUrl.trim(),
      displayOrder,
      hasVariants: formHasVariants,
      hasAddons: formHasAddons,
    });

    setIsCreating(false);
    setEditingItem(null);
  };

  // Filter items
  const filtered = items.filter((item) => {
    if (selectedCat !== 'all' && item.categoryId !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Menu Dishes</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Add, update, duplicate, and set dietary details for all recipes.
          </p>
        </div>

        {!isCreating && !editingItem && (
          <button
            onClick={startCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        )}
      </div>

      {/* Item Form Drawer/Card */}
      {(isCreating || editingItem) && (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-neutral-300 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="text-sm font-bold text-neutral-900">
              {editingItem ? `Edit Dish: ${editingItem.name}` : 'Create New Menu Dish'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingItem(null);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Dish Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Handi Murgh Biryani"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formCatId}
                onChange={(e) => setFormCatId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Base Price ({profile.currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={5}
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Portion / Serving Info
              </label>
              <input
                type="text"
                value={formPortion}
                onChange={(e) => setFormPortion(e.target.value)}
                placeholder="e.g. Serves 1-2 · 450ml handi"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Spice Level
              </label>
              <select
                value={formSpiceLevel}
                onChange={(e) => setFormSpiceLevel(Number(e.target.value) as any)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              >
                <option value={0}>0 - Mild / None</option>
                <option value={1}>1 - Mild Warmth</option>
                <option value={2}>2 - Medium Spiced</option>
                <option value={3}>3 - Hot & Fiery</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Description / Ingredients
            </label>
            <textarea
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Detailed description of marinades, whole spices, and accompaniment..."
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Dish Image URL (Optional)
              </label>
              <input
                type="url"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://.../dish.jpg"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Initial Stock Status
              </label>
              <select
                value={formStockStatus}
                onChange={(e) => setFormStockStatus(e.target.value as StockStatus)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              >
                <option value="available">Available</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="temporarily_unavailable">Temporarily Unavailable</option>
                <option value="hidden">Hidden from Menu</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-100">
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsVeg}
                onChange={(e) => setFormIsVeg(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Pure Veg (Green Dot)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsBestseller}
                onChange={(e) => setFormIsBestseller(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Chef Bestseller</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formHasVariants}
                onChange={(e) => setFormHasVariants(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Has Portions / Sizes (e.g. Half / Full)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formHasAddons}
                onChange={(e) => setFormHasAddons(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Supports Add-on Groups</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
            >
              {editingItem ? 'Update Dish' : 'Save Dish'}
            </button>
          </div>
        </form>
      )}

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg font-medium text-neutral-700"
        >
          <option value="all">All Categories ({items.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({items.filter((i) => i.categoryId === c.id).length})
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {filtered.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);

            return (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <VegNonVegBadge isVeg={item.isVeg} size="sm" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">{item.name}</h4>
                      <SpiceLevelIndicator level={item.spiceLevel} />
                      {item.isBestseller && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          Bestseller
                        </span>
                      )}
                      {item.stockStatus !== 'available' && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                          {item.stockStatus === 'out_of_stock' ? 'Sold Out' : 'Unavailable'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span className="font-medium text-neutral-700">{cat?.name || 'Unassigned'}</span>
                      <span>·</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {profile.currencySymbol}{item.price.toFixed(2)}
                      </span>
                      {item.portionInfo && (
                        <>
                          <span>·</span>
                          <span>{item.portionInfo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => duplicateItem(item)}
                    className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Duplicate dish"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Edit dish"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) {
                        deleteItem(item.id);
                      }
                    }}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
