import React from 'react';
import { PackageCheck, AlertCircle, Info } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { StockStatus } from '../../../types';
import { VegNonVegBadge } from '../../common/DietaryBadge';

export const AdminStock: React.FC = () => {
  const { data, setItemStockStatus, isConnected } = useRestaurant();
  const { items, categories, profile } = data;

  const statusOptions: { value: StockStatus; label: string; color: string }[] = [
    { value: 'available', label: 'In Stock', color: 'bg-emerald-600 text-white' },
    { value: 'out_of_stock', label: 'Sold Out', color: 'bg-red-600 text-white' },
    { value: 'temporarily_unavailable', label: 'Prepping', color: 'bg-amber-600 text-white' },
    { value: 'hidden', label: 'Hidden', color: 'bg-neutral-800 text-white' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Stock & Availability Controls</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Rapid 1-tap switches for kitchen managers during dinner rush hours.
          </p>
        </div>

        {!isConnected && (
          <div className="p-2.5 bg-neutral-100 rounded-xl text-[11px] text-neutral-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Local demo mode: Status persists in this browser session.</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          return (
            <div
              key={item.id}
              className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <VegNonVegBadge isVeg={item.isVeg} size="sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{item.name}</h4>
                  <p className="text-xs text-neutral-500">
                    {cat?.name} · {profile.currencySymbol}{item.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Segmented stock buttons for rapid tap */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl shrink-0">
                {statusOptions.map((opt) => {
                  const isCurrent = item.stockStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setItemStockStatus(item.id, opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isCurrent
                          ? `${opt.color} shadow-xs scale-102`
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
