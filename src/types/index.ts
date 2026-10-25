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
  weeklyClosingDay: string;
  schedule: Record<string, DaySchedule>;
  holidayNotice?: string;
  topbarHoursText?: string;
}

export interface WebsiteSections {
  showHero: boolean;
  showOrderModes: boolean;
  showSpecialOffers: boolean;
  showFeaturedMenu: boolean;
  showFullMenu: boolean;
  showAbout: boolean;
  showGallery: boolean;
  showHistory?: boolean;
  showChefs?: boolean;
  showTestimonials: boolean;
  showGoogleReviews: boolean;
  showReservation?: boolean;
  showBlog?: boolean;
  showNewsletter?: boolean;
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
  enableAdminPanelOrdering: boolean;
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

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderChannel = 'whatsapp' | 'admin';

export interface OrderItemSummary {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variantName?: string;
  addonNames?: string[];
  customerNote?: string;
  lineTotal: number;
  isVeg?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  deliveryLandmark?: string;
  specialInstructions?: string;
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  notes?: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TableReservation {
  id: string;
  createdAt: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  partySize: string;
  reservationDate: string;
  reservationTime: string;
  specialRequest?: string;
  status: ReservationStatus;
}

export interface ContactMessage {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  iconName?: string;
  imageUrl?: string;
  itemCountLabel?: string;
}

export type StockStatus = 'available' | 'out_of_stock' | 'temporarily_unavailable' | 'hidden';

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  isVeg: boolean;
  isBestseller: boolean;
  spiceLevel: 0 | 1 | 2 | 3;
  stockStatus: StockStatus;
  imageUrl?: string;
  displayOrder: number;
  hasVariants: boolean;
  hasAddons: boolean;
  variantIds?: string[];
  addonGroupIds?: string[];
  portionInfo?: string;
  calories?: string;
  prepTime?: string;
  rating?: number;
  reviewsCount?: number;
  tags?: string[];
}

export interface ItemVariant {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface AddonOption {
  id: string;
  groupId: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface AddonGroup {
  id: string;
  name: string;
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
  source: 'Google' | 'Zomato' | 'Diner' | string;
  date: string;
  dishRecommended?: string;
  avatarUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
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

export interface ChefProfile {
  id: string;
  name: string;
  role: string;
  experience: string;
  imageUrl: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface BlogPostItem {
  id: string;
  day: string;
  month: string;
  tag: string;
  title: string;
  author: string;
  commentsLabel: string;
  imageUrl: string;
  content: string;
}

export interface SpecialDealBanner {
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  titleLine2: string;
  description: string;
  originalPrice: string;
  dealPrice: string;
  buttonText: string;
  imageUrl: string;
  countdownHours: number;
  countdownMinutes: number;
  countdownSeconds: number;
}

export interface NewsletterContent {
  kicker: string;
  title: string;
  highlightWord: string;
  subtitle: string;
  buttonText: string;
  successMessage: string;
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

export interface HighlightItem {
  label: string;
  title: string;
}

export interface HeroFloatingBadge {
  title: string;
  subtitle: string;
}

export interface HeroContent {
  kicker: string;
  titlePrefix?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  title: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  highlights: HighlightItem[];
  floatingBadges?: HeroFloatingBadge[];
  marqueeItems?: string[];
  watermarkText?: string;
}

export interface AboutContent {
  kicker: string;
  title: string;
  story: string;
  mainImageUrl?: string;
  secondaryImageUrl?: string;
  experienceYears?: string;
  experienceLabel?: string;
  chefName?: string;
  chefRole?: string;
  box1Title: string;
  box1Desc: string;
  box2Title: string;
  box2Desc: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  quoteText: string;
}

export interface MenuSectionContent {
  kicker: string;
  title: string;
  subtitle: string;
  categoryKicker?: string;
  categoryTitle?: string;
  categorySubtitle?: string;
}

export interface OffersSectionContent {
  kicker: string;
  title: string;
  subtitle: string;
}

export interface ReviewsSectionContent {
  kicker: string;
  title: string;
  googleReviewsButtonText: string;
}

export interface LocationSectionContent {
  kicker: string;
  title: string;
  subtitle: string;
  cateringBannerText: string;
  cateringButtonText: string;
  reservationKicker?: string;
  reservationTitle?: string;
  reservationHeading?: string;
  reservationSubtitle?: string;
}

export interface FAQSectionContent {
  kicker: string;
  title: string;
}

export interface PolicyContent {
  privacyPolicyText: string;
  termsText: string;
}

export interface SectionContents {
  hero: HeroContent;
  about: AboutContent;
  menu: MenuSectionContent;
  offers: OffersSectionContent;
  reviews: ReviewsSectionContent;
  location: LocationSectionContent;
  faq: FAQSectionContent;
  policies: PolicyContent;
  specialDeal?: SpecialDealBanner;
  newsletter?: NewsletterContent;
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

export type ChatbotActionType =
  | 'menu'
  | 'bestsellers'
  | 'veg_menu'
  | 'offers'
  | 'order_now'
  | 'order_status'
  | 'book_table'
  | 'hours'
  | 'location'
  | 'delivery'
  | 'chefs'
  | 'faq'
  | 'custom_query';

export interface ChatbotQuickReply {
  id: string;
  labelEn: string;
  labelHi: string;
  labelGu: string;
  action: ChatbotActionType;
  customQuery?: string;
  isActive: boolean;
}

export interface ChatbotCustomQA {
  id: string;
  questionTitle: string;
  keywords: string; // comma-separated trigger words
  answerEn: string;
  answerHi?: string;
  answerGu?: string;
  attachLocationCard?: boolean;
  attachWhatsAppButton?: boolean;
  isActive: boolean;
}

export interface ChatbotUnansweredQuestion {
  id: string;
  questionText: string;
  language: 'en' | 'hi' | 'gu';
  askedAt: string;
  count: number;
  status: 'pending' | 'resolved';
  resolvedQAId?: string;
  sessionId?: string;
}

export interface ChatbotChatMessageLog {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  matchedTopic?: string;
  isUnanswered?: boolean;
  locationUrl?: string;
}

export interface ChatbotSessionLog {
  id: string;
  customerLabel: string;
  customerPhone?: string;
  startedAt: string;
  lastMessageAt: string;
  language: 'en' | 'hi' | 'gu';
  messagesCount: number;
  unansweredCount: number;
  orderPlaced?: boolean;
  whatsappClicked?: boolean;
  locationShared?: boolean;
  messages: ChatbotChatMessageLog[];
}

export interface ChatbotSettings {
  enabled: boolean;
  botName: string;
  botSubtitle: string;
  position: 'right' | 'left';
  defaultLanguage: 'en' | 'hi' | 'gu';
  useBrandColor: boolean;
  customColor: string;
  welcomeMessageEn: string;
  welcomeMessageHi: string;
  welcomeMessageGu: string;
  fallbackMessageEn: string;
  fallbackMessageHi: string;
  fallbackMessageGu: string;
  orderConfirmationNote: string;
  enableOrderPlacement: boolean;
  enableOrderStatusLookup: boolean;
  enableTableBooking: boolean;
  enableDishCards: boolean;
  enableWhatsAppHandoff: boolean;
  autoOpenDelaySeconds: number; // 0 = disabled
  // WhatsApp Support & Fallback Handoff
  whatsappSupportNumber?: string;
  whatsappFallbackPromptEn?: string;
  whatsappFallbackPromptHi?: string;
  whatsappFallbackPromptGu?: string;
  autoShowWhatsAppOnUnanswered?: boolean;
  autoRedirectToWhatsAppOnUnanswered?: boolean;
  // Location & Google Maps Settings
  enableLocationSharing?: boolean;
  customLocationTitle?: string;
  customLocationAddress?: string;
  customLocationLandmark?: string;
  customLocationMapsUrl?: string;
  customLatitude?: string;
  customLongitude?: string;
  // Quick Replies & Custom Q&As
  quickReplies: ChatbotQuickReply[];
  customQAs: ChatbotCustomQA[];
  // Unanswered Queries & Customer Chat Logs
  unansweredQuestions?: ChatbotUnansweredQuestion[];
  chatLogs?: ChatbotSessionLog[];
}

export interface AudioTrackItem {
  id: string;
  title: string;
  subtitle?: string;
  audioUrl: string; // URL or base64 data URI from Admin upload / mic recording
  durationLabel?: string;
  category: 'welcome_voice' | 'promo_offer' | 'background_music';
  isActive: boolean;
}

export interface AudioSettings {
  enabled: boolean;
  sourceMode: 'file_or_url' | 'voice_tts' | 'both';
  playerStyle: 'welcome_card_and_mini' | 'floating_pill_only';
  position: 'bottom_left' | 'top_right';
  autoPlayOnLoad: boolean;
  unlockOnFirstTap: boolean;
  loopAudio: boolean;
  autoHideOnEnd: boolean;
  showSkipButton: boolean;
  playFrequency: 'every_visit' | 'once_per_session' | 'once_per_day';
  delaySeconds: number;
  volume: number; // 0.1 to 1.0
  // Active Audio File / URL
  activeAudioUrl: string;
  activeTrackTitle: string;
  activeTrackSubtitle: string;
  // Welcome Audio Card Customization
  welcomeBadgeText: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  listenButtonText: string;
  skipButtonText: string;
  // Interactive CTA Button inside Audio Card
  enableCtaButton: boolean;
  ctaButtonText: string;
  ctaTargetSection: string; // e.g. '#special', '#menu', '#reservation'
  // Smart Voice Announcer (TTS) Settings
  voiceLanguage: 'hi-IN' | 'gu-IN' | 'en-IN';
  voiceTextHi: string;
  voiceTextGu: string;
  voiceTextEn: string;
  voiceRate: number; // 0.8 to 1.2
  voicePitch: number; // 0.8 to 1.2
  enableWelcomeChime: boolean;
  enableCartSoundEffects: boolean;
  // Saved Audio Playlist / Uploaded Tracks
  tracks: AudioTrackItem[];
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
  chefs?: ChefProfile[];
  historyTimeline?: TimelineEvent[];
  blogPosts?: BlogPostItem[];
  socials: SocialLinks;
  seo: SEOSettings;
  sectionContents?: SectionContents;
  chatbotSettings?: ChatbotSettings;
  audioSettings?: AudioSettings;
  orders?: Order[];
  reservations?: TableReservation[];
  contactMessages?: ContactMessage[];
  partyInquiries?: PartyInquiry[];
}

