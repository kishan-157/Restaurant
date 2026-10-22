import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { MenuCategory } from '../../../types';

interface AdminCategoriesProps {
  showToast?: (msg: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ showToast }) => {
  const { data, saveCategory, deleteCategory } = useRestaurant();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('🍔');
  const [imageUrl, setImageUrl] = useState('');
  const [itemCountLabel, setItemCountLabel] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);

  const toast = (msg: string) => {
    if (showToast) showToast(msg);
  };

  const startNew = () => {
    setEditingId('new');
    setName('');
    setDescription('');
    setIconName('🍔');
    setImageUrl('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80');
    setItemCountLabel('');
    setDisplayOrder(data.categories.length + 1);
  };

  const startEdit = (cat: MenuCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIconName(cat.iconName || '🍽️');
    setImageUrl(cat.imageUrl || '');
    setItemCountLabel(cat.itemCountLabel || '');
    setDisplayOrder(cat.displayOrder);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const newCat: MenuCategory = {
      id: editingId === 'new' ? `cat-${Date.now()}` : editingId!,
      name: name.trim(),
      slug,
      description: description.trim() || `${name.trim()} crafted fresh to order`,
      iconName: iconName.trim() || '🍽️',
      imageUrl: imageUrl.trim() || undefined,
      itemCountLabel: itemCountLabel.trim() || undefined,
      displayOrder: Number(displayOrder) || 1,
      isActive: true,
    };

    saveCategory(newCat);
    setEditingId(null);
    toast('Category saved & synced!');
  };

  const toggleActive = (cat: MenuCategory) => {
    saveCategory({ ...cat, isActive: !cat.isActive });
    toast(`Category "${cat.name}" ${!cat.isActive ? 'enabled' : 'hidden'}.`);
  };

  const handleDelete = (id: string, catName: string) => {
    deleteCategory(id);
    toast(`Category "${catName}" deleted.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#e0d6c8] rounded-3xl p-6">
        <div>
          <h3
            className="text-xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Menu Categories ({data.categories.length})
          </h3>
          <p className="text-xs text-[#7a6e65] mt-1">
            Customize circular category photos, icons, item count labels, and display order for the Sarab category strip & menu tabs.
          </p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {editingId && (
        <form
          onSubmit={handleSave}
          className="bg-white border-2 border-[#e8281a]/30 rounded-3xl p-6 space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-[#f0e8dc] pb-3">
            <h4
              className="text-base font-bold text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {editingId === 'new' ? 'Create New Menu Category' : 'Edit Menu Category'}
            </h4>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="p-1.5 rounded-lg text-[#7a6e65] hover:text-[#1a1a1a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Burgers, Pizza, Fried Chicken"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#e8281a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">Emoji / Icon</label>
              <input
                type="text"
                value={iconName}
                onChange={e => setIconName(e.target.value)}
                placeholder="🍔"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#e8281a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={e => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#e8281a]"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">
                Circular Category Photo URL (Displayed in Category Strip)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#e8281a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">
                Custom Count Label (Optional)
              </label>
              <input
                type="text"
                value={itemCountLabel}
                onChange={e => setItemCountLabel(e.target.value)}
                placeholder="Auto-calculated if empty"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-[#1a1a1a] text-sm focus:outline-none focus:border-[#e8281a]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 rounded-xl bg-[#fff8f0] text-[#5a524c] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e8281a] text-white text-xs font-semibold shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Category</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...data.categories]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(cat => {
            const itemCount = data.items.filter(i => i.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className={`p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all ${
                  cat.isActive
                    ? 'bg-white border-[#e0d6c8]'
                    : 'bg-[#fff8f0]/60 border-[#e0d6c8]/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#e8281a]/20 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#fff8f0] border border-[#e0d6c8] flex items-center justify-center text-2xl shrink-0">
                      {cat.iconName || '🍽️'}
                    </div>
                  )}
                  <div className="truncate">
                    <h4 className="font-bold text-[#1a1a1a] text-sm truncate">{cat.name}</h4>
                    <p className="text-xs text-[#7a6e65]">
                      {itemCount} dishes • Order #{cat.displayOrder}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      cat.isActive
                        ? 'bg-[#2d6a4f]/15 text-[#2d6a4f]'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {cat.isActive ? 'Visible' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-2 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#1a1a1a] border border-[#e0d6c8] cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-xl bg-[#fff8f0] hover:bg-red-50 text-[#7a6e65] hover:text-[#e8281a] border border-[#e0d6c8] cursor-pointer"
                    title="Delete Category"
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
