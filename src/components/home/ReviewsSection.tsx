import React from 'react';
import { Star, MessageSquareQuote, ExternalLink } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const ReviewsSection: React.FC = () => {
  const { data } = useRestaurant();
  const { testimonials, websiteSections, profile } = data;

  if (!websiteSections.showTestimonials || testimonials.length === 0) return null;

  return (
    <section id="reviews" className="py-16 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Diner Experiences</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-neutral-900">
              Loved by Food Connoisseurs
            </h2>
          </div>

          {websiteSections.showGoogleReviews && profile.googleMapsUrl && (
            <a
              href={profile.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors shadow-xs"
            >
              <span>Read All Google Reviews</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-neutral-700 leading-relaxed italic">
                  "{t.reviewText}"
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">{t.author}</span>
                  <span className="text-neutral-400 font-medium">{t.source} · {t.date}</span>
                </div>

                {t.dishRecommended && (
                  <p className="text-[11px] text-amber-800 font-medium">
                    Favorite: {t.dishRecommended}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
