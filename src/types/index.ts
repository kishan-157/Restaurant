export interface RestaurantProfile {
  name: string;
  tagline: string;
  description: string;
  story: string;
  logoUrl: string;
  faviconUrl: string;
  heroImageUrl: string;
  cuisineType: string;
  priceRange: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  googleMapsUrl: string;
  currencySymbol: string;
  currencyCode: string;
  themePreset: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchOpenTime?: string;
  lunchCloseTime?: string;
}

export interface OpeningHours {
  weeklyClosingDay: string; // e.g. "None" or "Monday"
  schedule: Record<string, DaySchedule>;
  holidayNotice?: string;
}

export interface WebsiteSections {
  showHero: boolean;
  showOrderModes: boolean;
  showSpecialOffers: boolean;
  showFeaturedMenu: boolean;
  showFullMenu: boolean;
  showAbout: boolean;
  showGallery: boolean;
  showTestimonials: boolean;
  showGoogleReviews: boolean;
  showLocationHours: boolean;
  showCateringInquiry: boolean;
  showFaq: boolean;
  showFooter: boolean;
}

export interface OrderSettings {
  acceptHomeDelivery: boolean;
  acceptTakeaway: boolean;
  acceptPickup: boolean;
  enableWhatsAppOrdering: boolean;
  enableOnlinePlatformLinks: boolean;
  enableCartAndCheckout: boolean;
  temporarilyPauseOrders: boolean;
  pauseMessage: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
  estimatedDeliveryTime: string;
  estimatedPickupTime: string;
  serviceAreaNotes: string;
  pickupInstructions: string;
  swiggyUrl: string;
  zomatoUrl: string;
  otherPlatformName: string;
  otherPlatformUrl: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  iconName?: string;
}

export type StockStatus = 'available' | 'out_of_stock' | 'temporarily_unavailable' | 'hidden';

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isBestseller: boolean;
  spiceLevel: 0 | 1 | 2 | 3; // 0 = Mild/None, 1 = Mild, 2 = Medium, 3 = Spicy
  stockStatus: StockStatus;
  imageUrl?: string;
  displayOrder: number;
  hasVariants: boolean;
  hasAddons: boolean;
  variantIds?: string[];
  addonGroupIds?: string[];
  portionInfo?: string;
  tags?: string[];
}

export interface ItemVariant {
  id: string;
  menuItemId: string;
  name: string; // e.g., "Half", "Full", "Small (2 pcs)", "Large (4 pcs)"
  price: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface AddonOption {
  id: string;
  groupId: string;
  name: string; // e.g., "Extra Mint Chutney", "Amul Butter Topping"
  price: number;
  isAvailable: boolean;
}

export interface AddonGroup {
  id: string;
  name: string; // e.g., "Choice of Gravy / Bread", "Extra Toppings"
  description?: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: AddonOption[];
}

export interface CartItem {
  cartItemId: string;
  item: MenuItem;
  selectedVariant?: ItemVariant;
  selectedAddons: AddonOption[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customerNote?: string;
}

export type OrderType = 'delivery' | 'takeaway' | 'pickup';

export interface CheckoutDetails {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress: string;
  deliveryLandmark?: string;
  specialInstructions?: string;
}

export interface Testimonial {
  id: string;
  author: string;
  rating: number;
  reviewText: string;
  source: 'Google' | 'Zomato' | 'Diner';
  date: string;
  dishRecommended?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'food' | 'ambience' | 'chef';
  imageUrl: string;
  displayOrder: number;
}

export interface SpecialOffer {
  id: string;
  title: string;
  code: string;
  description: string;
  discountBadge: string;
  validUntil: string;
  isActive: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  googleBusiness: string;
  youtube?: string;
  twitter?: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImageUrl: string;
}

export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  isConnected: boolean;
  lastVerifiedAt?: string;
  schemaVersion?: string;
  authEmail?: string;
  authSession?: boolean;
}

export interface RestaurantDatabaseBundle {
  version: string;
  exportedAt: string;
  profile: RestaurantProfile;
  openingHours: OpeningHours;
  websiteSections: WebsiteSections;
  orderSettings: OrderSettings;
  categories: MenuCategory[];
  items: MenuItem[];
  variants: ItemVariant[];
  addonGroups: AddonGroup[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  offers: SpecialOffer[];
  faqs: FAQItem[];
  socials: SocialLinks;
  seo: SEOSettings;
}

export interface PartyInquiry {
  id: string;
  guestCount: number;
  eventDate: string;
  eventType: 'Birthday' | 'Anniversary' | 'Corporate' | 'Family Gathering' | 'Other';
  name: string;
  phone: string;
  requirements: string;
  createdAt: string;
}
