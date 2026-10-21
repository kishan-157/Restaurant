import React, { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { FoodVisual } from '../common/FoodVisual';

export const GallerySection: React.FC = () => {
  const { data } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'ambience' | 'chef'>('all');

  if (!data.websiteSections.showGallery || data.gallery.length === 0) return null;

  const filteredGallery = data.gallery.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <section id="gallery" className="py-16 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Visual Journey</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
              Restaurant Gallery & Moments
            </h2>
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-neutral-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Photos
            </button>
            <button
              onClick={() => setActiveTab('food')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'food'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Royal Dishes
            </button>
            <button
              onClick={() => setActiveTab('ambience')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'ambience'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Ambience
            </button>
            <button
              onClick={() => setActiveTab('chef')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'chef'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Kitchen & Charcoal
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-800/50 shadow-md hover:border-amber-600/50 transition-colors"
            >
              <FoodVisual
                imageUrl={item.imageUrl}
                title={item.title}
                category={item.category}
                aspectRatio="4:3"
                className="w-full h-64"
              />

              <div className="p-4 bg-neutral-800/90 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-200 line-clamp-1">
                  {item.title}
                </span>
                <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
