import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Search, Star, Flame } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { MenuItem } from '../../../types';

interface AdminMenuItemsProps {
  showToast?: (msg: string) => void;
}

export const AdminMenuItems: React.FC<AdminMenuItemsProps> = ({ showToast }) => {
  const { data, saveItem, deleteItem, setItemStockStatus } = useRestaurant();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const toast = (msg: string) => {
    if (showToast) showToast(msg);
  };

  const filteredItems = data.items.filter(item => {
    const matchesCat = filterCat === 'all' || item.categoryId === filterCat;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const openNewItemModal = () => {
    setEditingItem({
      id: `item-${Date.now()}`,
      categoryId: data.categories[0]?.id || '',
      name: '',
      description: '',
      price: 12.99,
      oldPrice: undefined,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
      isVeg: false,
      isBestseller: false,
      spiceLevel: 1,
      stockStatus: 'available',
      displayOrder: data.items.length + 1,
      hasVariants: false,
      hasAddons: false,
      calories: '520 kcal',
      prepTime: '15-20 min',
      rating: 4.9,
      reviewsCount: 45,
      tags: ['Popular'],
    });
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    saveItem(editingItem);
    setEditingItem(null);
    toast(`Dish "${editingItem.name}" saved & synced!`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#e0d6c8] rounded-3xl p-6">
        <div>
          <h3
            className="text-xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Menu Dishes & Pricing ({data.items.length})
          </h3>
          <p className="text-xs text-[#7a6e65] mt-1">
            Customize dish photos, prices, strikethrough old prices, ratings, calories, tags, and stock status.
          </p>
        </div>
        <button
          onClick={openNewItemModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-[#e0d6c8] rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7a6e65] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes by name or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e8281a]"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a] focus:outline-none"
        >
          <option value="all">All Categories ({data.items.length})</option>
          {data.categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Edit / Create Dish Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveItem}
            className="bg-white border border-[#e0d6c8] rounded-3xl p-6 max-w-3xl w-full space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#f0e8dc] pb-3">
              <h4
                className="text-xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {editingItem.name ? `Edit Dish: ${editingItem.name}` : 'Add New Menu Dish'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-xs font-semibold text-[#7a6e65] hover:text-[#1a1a1a] px-2.5 py-1 rounded-lg bg-[#fff8f0]"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Category</label>
                <select
                  value={editingItem.categoryId}
                  onChange={e => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                >
                  {data.categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Selling Price ({data.profile.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingItem.price}
                  onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Old Strikethrough Price (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.oldPrice || ''}
                  onChange={e =>
                    setEditingItem({
                      ...editingItem,
                      oldPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 16.99"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Spice Level</label>
                <select
                  value={editingItem.spiceLevel}
                  onChange={e =>
                    setEditingItem({
                      ...editingItem,
                      spiceLevel: Number(e.target.value) as 0 | 1 | 2 | 3,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                >
                  <option value={0}>0 - Mild / No Spice</option>
                  <option value={1}>1 - Medium</option>
                  <option value={2}>2 - Spicy</option>
                  <option value={3}>3 - Extra Hot</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Dish Image URL</label>
                <input
                  type="text"
                  value={editingItem.imageUrl || ''}
                  onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Calories Badge</label>
                <input
                  type="text"
                  value={editingItem.calories || ''}
                  onChange={e => setEditingItem({ ...editingItem, calories: e.target.value })}
                  placeholder="e.g. 580 kcal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">Prep Time</label>
                <input
                  type="text"
                  value={editingItem.prepTime || ''}
                  onChange={e => setEditingItem({ ...editingItem, prepTime: e.target.value })}
                  placeholder="e.g. 15-20 min"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Star Rating (1.0 - 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={editingItem.rating ?? 4.9}
                  onChange={e => setEditingItem({ ...editingItem, rating: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Card Badges / Tags (Comma-separated, e.g. Popular, Hot, New)
                </label>
                <input
                  type="text"
                  value={(editingItem.tags || []).join(', ')}
                  onChange={e =>
                    setEditingItem({
                      ...editingItem,
                      tags: e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Popular, Best Seller, Hot"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-sm"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.isVeg}
                  onChange={e => setEditingItem({ ...editingItem, isVeg: e.target.checked })}
                  className="rounded accent-[#2d6a4f]"
                />
                <span>Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.isBestseller}
                  onChange={e => setEditingItem({ ...editingItem, isBestseller: e.target.checked })}
                  className="rounded accent-[#e8281a]"
                />
                <span>Popular / Best Seller Badge</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.stockStatus === 'available'}
                  onChange={e =>
                    setEditingItem({
                      ...editingItem,
                      stockStatus: e.target.checked ? 'available' : 'out_of_stock',
                    })
                  }
                  className="rounded accent-[#2d6a4f]"
                />
                <span>In Stock (Available)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#f0e8dc]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-[#fff8f0] text-[#5a524c] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-semibold shadow-md cursor-pointer"
              >
                Save Dish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const cat = data.categories.find(c => c.id === item.categoryId);
          const isAvailable = item.stockStatus === 'available';
          return (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-white border border-[#e0d6c8] flex gap-4 items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-16 h-16 rounded-2xl object-cover bg-[#fff8f0] shrink-0 border border-[#e0d6c8]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex items-center justify-center text-xl shrink-0">
                    🍽️
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.isVeg ? 'bg-[#2d6a4f]' : 'bg-[#e8281a]'
                      }`}
                    />
                    <h4 className="font-bold text-[#1a1a1a] text-sm truncate">{item.name}</h4>
                  </div>
                  <p className="text-xs text-[#7a6e65] truncate">{cat?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-[#e8281a]">
                      {data.profile.currencySymbol}
                      {item.price.toFixed(2)}
                    </span>
                    {item.oldPrice && (
                      <span className="text-xs text-[#7a6e65] line-through">
                        {data.profile.currencySymbol}
                        {item.oldPrice.toFixed(2)}
                      </span>
                    )}
                    {item.isBestseller && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-[#e8281a]/10 text-[#e8281a] font-bold">
                        <Flame className="w-2.5 h-2.5" /> Best Seller
                      </span>
                    )}
                    {item.rating && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#9a6200] font-bold">
                        <Star className="w-3 h-3 fill-[#f6a623] text-[#f6a623]" /> {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    const nextStatus = isAvailable ? 'out_of_stock' : 'available';
                    setItemStockStatus(item.id, nextStatus);
                    toast(`${item.name} marked ${!isAvailable ? 'In Stock' : 'Sold Out'}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    isAvailable
                      ? 'bg-[#2d6a4f]/15 text-[#2d6a4f]'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isAvailable ? 'In Stock' : 'Sold Out'}
                </button>
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#1a1a1a] border border-[#e0d6c8] cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    deleteItem(item.id);
                    toast(`Deleted "${item.name}"`);
                  }}
                  className="p-2 rounded-xl bg-[#fff8f0] hover:bg-red-50 text-[#7a6e65] hover:text-[#e8281a] border border-[#e0d6c8] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
