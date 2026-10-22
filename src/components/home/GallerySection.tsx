import React, { useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight, Instagram, Facebook, Twitter } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

export const GallerySection: React.FC = () => {
  const { data } = useRestaurant();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const galleryItems =
    data.gallery && data.gallery.length > 0 ? data.gallery : DEFAULT_RESTAURANT_DATA.gallery;

  const historyTimeline =
    data.historyTimeline && data.historyTimeline.length > 0
      ? data.historyTimeline
      : DEFAULT_RESTAURANT_DATA.historyTimeline!;

  const chefs =
    data.chefs && data.chefs.length > 0 ? data.chefs : DEFAULT_RESTAURANT_DATA.chefs!;

  const handlePrev = () => {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx - 1 + galleryItems.length) % galleryItems.length);
  };

  const handleNext = () => {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx + 1) % galleryItems.length);
  };

  return (
    <>
      {/* ===================== SARAB GALLERY SECTION (#gallery) ===================== */}
      {data.websiteSections.showGallery && galleryItems.length > 0 && (
        <section id="gallery" className="py-18 sm:py-22 bg-[#f9f5f0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="slbl">Food Showcase</span>
              <h2 className="stitle">
                Let&apos;s See Our <span>Fast Food</span>
              </h2>
              <div className="sline" />
            </div>

            {/* Sarab Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {galleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIdx(idx)}
                  className={`group relative rounded-[14px] overflow-hidden cursor-pointer ${
                    idx === 0 ? 'md:row-span-2 h-[260px] md:h-[444px]' : 'h-[215px]'
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                    <span className="text-white font-semibold text-sm flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-[#f6a623]" />
                      <span>{item.title}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Lightbox Popup */}
      {lightboxIdx !== null && galleryItems[lightboxIdx] && (
        <div
          id="galPop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-[#e8281a] text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={galleryItems[lightboxIdx].imageUrl}
              alt={galleryItems[lightboxIdx].title}
              className="w-full h-72 sm:h-80 object-cover"
            />

            <div className="p-6 text-center space-y-2">
              <h5 className="font-heading text-xl font-bold text-[#1a1a1a]">
                {galleryItems[lightboxIdx].title}
              </h5>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                {galleryItems[lightboxIdx].description ||
                  'Freshly prepared daily in our kitchen with premium ingredients.'}
              </p>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-full bg-[#fff8f0] hover:bg-[#e8281a] text-[#1a1a1a] hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-full bg-[#fff8f0] hover:bg-[#e8281a] text-[#1a1a1a] hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SARAB HISTORY TIMELINE (#history) ===================== */}
      {data.websiteSections.showHistory !== false && historyTimeline.length > 0 && (
        <section id="history" className="py-18 sm:py-22 bg-[#fff8f0]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="slbl">Our Journey</span>
              <h2 className="stitle">
                A History of <span>{data.profile.name || 'Restaurant'}</span>
              </h2>
              <div className="sline" />
              <p className="text-[#777777] text-sm sm:text-[15px] max-w-[480px] mx-auto leading-[1.8]">
                From humble beginnings to the city&apos;s most beloved restaurant - every chapter
                written with passion.
              </p>
            </div>

            {/* Alternating Center Timeline */}
            <div className="relative py-4">
              <div
                aria-hidden="true"
                className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#e8281a] to-[#f6a623]"
              />

              <div className="space-y-10 sm:space-y-12">
                {historyTimeline.map((item, idx) => {
                  const isLeft = idx % 2 === 0;
                  return (
                    <div
                      key={item.id || item.year}
                      className="grid grid-cols-1 md:grid-cols-[1fr_40px_1fr] items-start gap-4 md:gap-0"
                    >
                      <div
                        className={`md:pr-8 ${
                          isLeft ? 'md:text-right block' : 'hidden md:block md:invisible'
                        }`}
                      >
                        <div className="font-script text-xl text-[#e8281a] mb-0.5">{item.year}</div>
                        <h5 className="font-heading text-lg font-bold text-[#1a1a1a] mb-1.5">
                          {item.title}
                        </h5>
                        <p className="text-[13.5px] text-[#777777] leading-[1.7]">
                          {item.description}
                        </p>
                      </div>

                      <div className="hidden md:flex justify-center pt-1.5">
                        <div className="w-[18px] h-[18px] rounded-full bg-[#e8281a] border-4 border-white shadow-[0_0_0_3px_rgba(232,40,26,0.3)]" />
                      </div>

                      <div
                        className={`md:pl-8 ${
                          !isLeft ? 'md:text-left block' : 'hidden md:block md:invisible'
                        }`}
                      >
                        <div className="font-script text-xl text-[#e8281a] mb-0.5">{item.year}</div>
                        <h5 className="font-heading text-lg font-bold text-[#1a1a1a] mb-1.5">
                          {item.title}
                        </h5>
                        <p className="text-[13.5px] text-[#777777] leading-[1.7]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== SARAB MEET OUR EXPERT CHEFS (#chefs) ===================== */}
      {data.websiteSections.showChefs !== false && chefs.length > 0 && (
        <section id="chefs" className="py-18 sm:py-22 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="slbl">The Culinary Team</span>
              <h2 className="stitle">
                Meet Our Expert <span>Chefs</span>
              </h2>
              <div className="sline" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {chefs.map((chef) => (
                <div
                  key={chef.id}
                  className="group rounded-[18px] overflow-hidden bg-white shadow-[0_4px_18px_rgba(0,0,0,0.07)] hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-300"
                >
                  <div className="relative h-[268px] bg-[#fef0dc] overflow-hidden">
                    <img
                      src={chef.imageUrl || 'https://preview.themewagon.com/sarab/img/chefs/1.jpg'}
                      alt={chef.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute -bottom-12 group-hover:bottom-0 left-0 right-0 flex justify-center gap-2 py-3 bg-gradient-to-t from-black/75 to-transparent transition-all duration-300">
                      <a
                        href={chef.instagramUrl || '#chefs'}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${chef.name} Instagram`}
                        className="w-8 h-8 rounded-full bg-white text-[#1a1a1a] hover:bg-[#e8281a] hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={chef.facebookUrl || '#chefs'}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${chef.name} Facebook`}
                        className="w-8 h-8 rounded-full bg-white text-[#1a1a1a] hover:bg-[#e8281a] hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={chef.twitterUrl || '#chefs'}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${chef.name} Twitter`}
                        className="w-8 h-8 rounded-full bg-white text-[#1a1a1a] hover:bg-[#e8281a] hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="p-5 text-center">
                    <h4 className="font-heading text-lg font-bold text-[#1a1a1a]">{chef.name}</h4>
                    <div className="text-xs font-semibold text-[#e8281a] uppercase tracking-wider mt-0.5">
                      {chef.role}
                    </div>
                    <div className="text-xs text-[#888888] mt-1">{chef.experience}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};
