import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const OffersSection: React.FC = () => {
  const { data } = useRestaurant();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!data.websiteSections.showSpecialOffers || data.offers.length === 0) return null;

  const activeOffers = data.offers.filter((o) => o.isActive);
  if (activeOffers.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section id="offers" className="py-12 bg-amber-50/40 border-b border-amber-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" />
            <span>Direct Order Benefits</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-900">
            Exclusive Offers & Promo Deals
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Apply these coupon codes during WhatsApp confirmation to claim instant savings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activeOffers.map((offer) => (
            <div
              key={offer.id}
              className="relative p-5 bg-white rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    {offer.discountBadge}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium">{offer.validUntil}</span>
                </div>
                <h3 className="text-base font-bold text-neutral-900">{offer.title}</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{offer.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                    {offer.code}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(offer.code)}
                  className="px-3 py-1 text-xs font-medium text-amber-900 hover:text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
