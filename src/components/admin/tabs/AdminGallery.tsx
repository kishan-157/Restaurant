import React, { useState } from 'react';
import { Plus, Trash2, Images } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { GalleryItem } from '../../../types';
import { FoodVisual } from '../../common/FoodVisual';

export const AdminGallery: React.FC = () => {
  const { data, saveGalleryItem, deleteGalleryItem } = useRestaurant();
  const { gallery } = data;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'food' | 'ambience' | 'chef'>('food');
  const [imageUrl, setImageUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: title.trim(),
      category,
      imageUrl: imageUrl.trim(),
      displayOrder: gallery.length + 1,
    };

    saveGalleryItem(newItem);
    setTitle('');
    setImageUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Gallery & Visual Assets</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Curate showcase photos of signature handis, restaurant interior, and tandoor fires.
          </p>
        </div>
      </div>

      {/* Add Photo Form */}
      <form onSubmit={handleAdd} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Add New Photo Record
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Photo Caption / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Saffron Dum Biryani Handi"
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
            >
              <option value="food">Royal Dishes (Food)</option>
              <option value="ambience">Dining Courtyard (Ambience)</option>
              <option value="chef">Kitchen & Clay Tandoor (Chef)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Image URL (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://.../photo.jpg"
                className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shrink-0"
              >
                Add Photo
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3"
          >
            <FoodVisual
              imageUrl={item.imageUrl}
              title={item.title}
              category={item.category}
              aspectRatio="4:3"
              className="w-full h-40 rounded-xl"
            />
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-neutral-900 block truncate max-w-[180px]">
                  {item.title}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                  {item.category}
                </span>
              </div>
              <button
                onClick={() => deleteGalleryItem(item.id)}
                className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
