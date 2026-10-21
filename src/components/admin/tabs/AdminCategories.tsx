import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X, FolderTree } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { MenuCategory } from '../../../types';

export const AdminCategories: React.FC = () => {
  const { data, saveCategory, deleteCategory } = useRestaurant();
  const { categories, items } = data;

  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const startCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsActive(true);
  };

  const startEdit = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setIsCreating(false);
    setName(cat.name);
    setDescription(cat.description);
    setIsActive(cat.isActive);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = editingCategory ? editingCategory.id : `cat-${Date.now()}`;
    const displayOrder = editingCategory ? editingCategory.displayOrder : categories.length + 1;

    saveCategory({
      id,
      name: name.trim(),
      slug,
      description: description.trim(),
      displayOrder,
      isActive,
    });

    setIsCreating(false);
    setEditingCategory(null);
  };

  const moveOrder = (cat: MenuCategory, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    if (idx < 0) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const currentOrder = sorted[idx].displayOrder;
    const targetOrder = sorted[swapIdx].displayOrder;

    saveCategory({ ...sorted[idx], displayOrder: targetOrder });
    saveCategory({ ...sorted[swapIdx], displayOrder: currentOrder });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Menu Categories</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organize dishes into sections (Starters, Curries, Biryanis, Breads, Desserts).
          </p>
        </div>

        {!isCreating && !editingCategory && (
          <button
            onClick={startCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {/* Create / Edit Form Drawer/Card */}
      {(isCreating || editingCategory) && (
        <form onSubmit={handleSave} className="p-5 bg-white rounded-2xl border border-neutral-300 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Menu Category'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCategory(null);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sizzling Charcoal Starters"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Short Subtitle / Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Marinated overnight in aromatic spices and charred in clay oven"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCategory"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="isActiveCategory" className="text-xs font-medium text-neutral-700">
              Active & visible on public digital menu
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCategory(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
            >
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs divide-y divide-neutral-100 overflow-hidden">
        {categories
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((cat, idx) => {
            const itemCount = items.filter((i) => i.categoryId === cat.id).length;
            return (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveOrder(cat, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveOrder(cat, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">{cat.name}</h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                    <span className="text-[11px] text-neutral-400 block mt-1">
                      {itemCount} {itemCount === 1 ? 'dish' : 'dishes'} in this category
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}" and its associated dishes?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete category"
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
