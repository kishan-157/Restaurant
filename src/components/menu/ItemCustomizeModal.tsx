import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { MenuItem, ItemVariant, AddonOption } from '../../types';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { VegNonVegBadge, SpiceLevelIndicator } from '../common/DietaryBadge';
import { FoodVisual } from '../common/FoodVisual';

interface ItemCustomizeModalProps {
  item: MenuItem;
  onClose: () => void;
}

export const ItemCustomizeModal: React.FC<ItemCustomizeModalProps> = ({ item, onClose }) => {
  const { data } = useRestaurant();
  const { addToCart } = useCart();

  // Find variants for this item
  const variants = data.variants.filter((v) => v.menuItemId === item.id && v.isAvailable);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | undefined>(
    variants.length > 0 ? variants[0] : undefined
  );

  // Find addon groups
  const addonGroups = data.addonGroups;
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  // Toggle addon option
  const toggleAddon = (option: AddonOption, groupMax: number) => {
    const isSelected = selectedAddons.some((a) => a.id === option.id);
    if (isSelected) {
      setSelectedAddons((prev) => prev.filter((a) => a.id !== option.id));
    } else {
      // Check group max limit
      const currentInGroup = selectedAddons.filter((a) => a.groupId === option.groupId);
      if (currentInGroup.length >= groupMax) {
        // If max is 1, replace
        if (groupMax === 1) {
          setSelectedAddons((prev) => [...prev.filter((a) => a.groupId !== option.groupId), option]);
        }
        return;
      }
      setSelectedAddons((prev) => [...prev, option]);
    }
  };

  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    addToCart(item, selectedVariant, selectedAddons, quantity, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col">
        {/* Header with image */}
        <div className="relative">
          <FoodVisual
            imageUrl={item.imageUrl}
            title={item.name}
            category={item.categoryId}
            isVeg={item.isVeg}
            aspectRatio="16:9"
            className="w-full h-48"
          />
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <VegNonVegBadge isVeg={item.isVeg} />
              <SpiceLevelIndicator level={item.spiceLevel} />
              {item.isBestseller && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                  Bestseller
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-neutral-900">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Variants selection */}
          {variants.length > 0 && (
            <div className="pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-semibold text-neutral-900">Select Portion / Variant</h4>
                <span className="text-xs text-neutral-500 font-medium">Required (Choose 1)</span>
              </div>
              <div className="space-y-2">
                {variants.map((v) => {
                  const isChecked = selectedVariant?.id === v.id;
                  return (
                    <label
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-600 bg-amber-50/60 font-semibold text-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChecked ? 'border-amber-600 bg-amber-600' : 'border-neutral-400'
                          }`}
                        >
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{v.name}</span>
                      </div>
                      <span className="text-neutral-900 font-medium">
                        {data.profile.currencySymbol}
                        {v.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-on Groups */}
          {addonGroups.length > 0 && (
            <div className="pt-2 border-t border-neutral-100 space-y-4">
              {addonGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">{group.name}</h4>
                      {group.description && (
                        <p className="text-xs text-neutral-500">{group.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">
                      Up to {group.maxSelect} {group.maxSelect === 1 ? 'choice' : 'choices'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedAddons.some((a) => a.id === opt.id);
                      return (
                        <label
                          key={opt.id}
                          onClick={() => toggleAddon(opt, group.maxSelect)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                                isSelected ? 'border-white bg-white text-neutral-900' : 'border-neutral-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          <span className={isSelected ? 'text-amber-300 font-semibold' : 'text-neutral-600'}>
                            +{data.profile.currencySymbol}
                            {opt.price.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Cooking Note */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Cooking Instructions (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Less oil, extra spicy, no onions in raita..."
              maxLength={120}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-4">
          {/* Quantity stepper */}
          <div className="flex items-center border border-neutral-300 rounded-xl bg-white p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums text-neutral-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to cart CTA */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3 px-5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl flex items-center justify-between transition-colors shadow-sm"
          >
            <span>Add to Order</span>
            <span className="tabular-nums font-bold">
              {data.profile.currencySymbol}
              {totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
