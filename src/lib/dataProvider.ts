import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  RestaurantDatabaseBundle,
  RestaurantProfile,
  OpeningHours,
  WebsiteSections,
  OrderSettings,
  MenuCategory,
  MenuItem,
  ItemVariant,
  AddonGroup,
  GalleryItem,
  Testimonial,
  SpecialOffer,
  FAQItem,
  PartyInquiry,
  StockStatus,
  SupabaseConfig,
  SectionContents,
  Order,
  OrderStatus,
  ChefProfile,
  TimelineEvent,
  BlogPostItem,
  TableReservation,
  ReservationStatus,
  ContactMessage,
  SocialLinks,
  SEOSettings,
  ChatbotSettings,
  AudioSettings,
} from '../types';
import { DEFAULT_RESTAURANT_DATA } from '../data/defaultRestaurantData';
import { SCHEMA_VERSION } from './sqlGenerator';
import { safeStorage } from './storage';

const STORAGE_KEY = 'restaurant_sarab_template_data_v3';
const SUPABASE_CONFIG_KEY = 'restaurant_supabase_config_v1';

export interface VerificationResult {
  success: boolean;
  message: string;
  schemaVersion?: string;
  missingTables?: string[];
  details?: Record<string, boolean>;
}

type ChangeListener = () => void;

class DataProviderService {
  private memoryData: RestaurantDatabaseBundle;
  private supabaseClient: SupabaseClient | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private supabaseConfig: SupabaseConfig;
  private listeners: Set<ChangeListener> = new Set();

  constructor() {
    // 1. Initialize Supabase Config from storage or environment variables
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    const savedConfig = safeStorage.getItem(SUPABASE_CONFIG_KEY);
    if (savedConfig) {
      try {
        this.supabaseConfig = JSON.parse(savedConfig);
      } catch {
        this.supabaseConfig = {
          projectUrl: envUrl,
          anonKey: envKey,
          isConnected: Boolean(envUrl && envKey),
        };
      }
    } else {
      this.supabaseConfig = {
        projectUrl: envUrl,
        anonKey: envKey,
        isConnected: Boolean(envUrl && envKey),
      };
    }

    // 2. Initialize Restaurant Data from safe storage or defaults (zero fake orders)
    const savedData = safeStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const existingCategories: MenuCategory[] = Array.isArray(parsed.categories)
          ? parsed.categories
          : DEFAULT_RESTAURANT_DATA.categories;
        const mergedCategories = [
          ...existingCategories,
          ...DEFAULT_RESTAURANT_DATA.categories.filter(
            (dc) => !existingCategories.some((ec) => ec.id === dc.id)
          ),
        ];

        const existingItems: MenuItem[] = Array.isArray(parsed.items)
          ? parsed.items
          : DEFAULT_RESTAURANT_DATA.items;
        const mergedItems = [
          ...existingItems,
          ...DEFAULT_RESTAURANT_DATA.items.filter(
            (di) => !existingItems.some((ei) => ei.id === di.id)
          ),
        ];

        this.memoryData = {
          ...DEFAULT_RESTAURANT_DATA,
          ...parsed,
          categories: mergedCategories,
          items: mergedItems,
          profile: {
            ...DEFAULT_RESTAURANT_DATA.profile,
            ...(parsed.profile || {}),
          },
          openingHours: {
            ...DEFAULT_RESTAURANT_DATA.openingHours,
            ...(parsed.openingHours || {}),
            schedule: {
              ...DEFAULT_RESTAURANT_DATA.openingHours.schedule,
              ...(parsed.openingHours?.schedule || {}),
            },
          },
          websiteSections: {
            ...DEFAULT_RESTAURANT_DATA.websiteSections,
            ...(parsed.websiteSections || {}),
          },
          orderSettings: {
            ...DEFAULT_RESTAURANT_DATA.orderSettings,
            ...(parsed.orderSettings || {}),
          },
          sectionContents: {
            ...DEFAULT_RESTAURANT_DATA.sectionContents!,
            ...(parsed.sectionContents || {}),
            hero: {
              ...DEFAULT_RESTAURANT_DATA.sectionContents!.hero,
              ...(parsed.sectionContents?.hero || {}),
            },
            about: {
              ...DEFAULT_RESTAURANT_DATA.sectionContents!.about,
              ...(parsed.sectionContents?.about || {}),
            },
            menu: {
              ...DEFAULT_RESTAURANT_DATA.sectionContents!.menu,
              ...(parsed.sectionContents?.menu || {}),
            },
            specialDeal: {
              ...DEFAULT_RESTAURANT_DATA.sectionContents!.specialDeal!,
              ...(parsed.sectionContents?.specialDeal || {}),
            },
            newsletter: {
              ...DEFAULT_RESTAURANT_DATA.sectionContents!.newsletter!,
              ...(parsed.sectionContents?.newsletter || {}),
            },
            location: {
              ...DEFAULT_RESTAURANT_DATA.sectionContents!.location,
              ...(parsed.sectionContents?.location || {}),
            },
          },
          chefs: Array.isArray(parsed.chefs) ? parsed.chefs : DEFAULT_RESTAURANT_DATA.chefs,
          historyTimeline: Array.isArray(parsed.historyTimeline)
            ? parsed.historyTimeline
            : DEFAULT_RESTAURANT_DATA.historyTimeline,
          blogPosts: Array.isArray(parsed.blogPosts)
            ? parsed.blogPosts
            : DEFAULT_RESTAURANT_DATA.blogPosts,
          chatbotSettings: {
            ...DEFAULT_RESTAURANT_DATA.chatbotSettings!,
            ...(parsed.chatbotSettings || {}),
            quickReplies: Array.isArray(parsed.chatbotSettings?.quickReplies)
              ? parsed.chatbotSettings.quickReplies
              : DEFAULT_RESTAURANT_DATA.chatbotSettings!.quickReplies,
            customQAs: Array.isArray(parsed.chatbotSettings?.customQAs)
              ? parsed.chatbotSettings.customQAs
              : DEFAULT_RESTAURANT_DATA.chatbotSettings!.customQAs,
            unansweredQuestions: Array.isArray(parsed.chatbotSettings?.unansweredQuestions)
              ? parsed.chatbotSettings.unansweredQuestions
              : [],
            chatLogs: Array.isArray(parsed.chatbotSettings?.chatLogs)
              ? parsed.chatbotSettings.chatLogs
              : [],
          },
          audioSettings: {
            ...DEFAULT_RESTAURANT_DATA.audioSettings!,
            ...(parsed.audioSettings || {}),
            tracks: Array.isArray(parsed.audioSettings?.tracks)
              ? parsed.audioSettings.tracks
              : DEFAULT_RESTAURANT_DATA.audioSettings!.tracks,
          },
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
          contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
          partyInquiries: Array.isArray(parsed.partyInquiries) ? parsed.partyInquiries : [],
        };

        // Auto-migrate legacy USD ($) cached data to Indian Rupees (₹ / INR) & IST
        this.migrateLegacyUsdToInr();
      } catch {
        this.memoryData = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA));
      }
    } else {
      this.memoryData = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA));
      this.saveToLocalStorage();
    }

    // Listen to cross-tab storage updates for instant multi-tab real-time sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.memoryData = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch {
            // ignore malformed JSON
          }
        }
      });
    }

    // 3. Connect to Supabase & Realtime if config is active
    if (this.supabaseConfig.isConnected && this.supabaseConfig.projectUrl && this.supabaseConfig.anonKey) {
      try {
        this.supabaseClient = createClient(this.supabaseConfig.projectUrl, this.supabaseConfig.anonKey);
        this.setupRealtimeSubscription();
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
  }

  private lastLocalMutationAt = 0;
  private bundlePushTimer: ReturnType<typeof setTimeout> | null = null;

  public subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  private setupRealtimeSubscription() {
    if (!this.supabaseClient) return;
    if (this.realtimeChannel) {
      this.supabaseClient.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.supabaseClient
      .channel('sarab-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          // Avoid overwriting local inputs while admin is actively typing/saving site_bundle
          if (
            payload.table === 'restaurant_profile' &&
            Date.now() - this.lastLocalMutationAt < 3000
          ) {
            return;
          }
          this.syncFromSupabase().then((ok) => {
            if (ok) this.notifyListeners();
          });
        }
      )
      .subscribe();
  }

  // --- LOCAL STORAGE HELPERS ---
  private migrateLegacyUsdToInr() {
    let changed = false;
    const p = this.memoryData.profile;

    if (p.currencySymbol === '$' || p.currencyCode === 'USD' || !p.currencySymbol) {
      p.currencySymbol = '₹';
      p.currencyCode = 'INR';
      changed = true;
    }

    if (p.priceRange?.includes('$')) {
      p.priceRange = '₹200 - ₹600 per person';
      changed = true;
    }

    if (p.phone === '+1 (800) 123-4567' || p.phone === '+1 (555) 234-5678') {
      p.phone = '+91 98765 43210';
      p.whatsappNumber = '919876543210';
      p.city = 'Mumbai, MH';
      p.postalCode = '400001';
      changed = true;
    }

    // Upgrade openingHours notice & IST label
    if (this.memoryData.openingHours) {
      if (this.memoryData.openingHours.holidayNotice?.includes('$25')) {
        this.memoryData.openingHours.holidayNotice =
          'Free Express Delivery on all orders over ₹499! Hot food delivered in 20–25 minutes (IST).';
        changed = true;
      }
      if (
        this.memoryData.openingHours.topbarHoursText &&
        !this.memoryData.openingHours.topbarHoursText.includes('IST')
      ) {
        this.memoryData.openingHours.topbarHoursText = `${this.memoryData.openingHours.topbarHoursText} (IST)`;
        changed = true;
      }
    }

    // Upgrade orderSettings if still on legacy USD values (2.99 / 10 / 25)
    const os = this.memoryData.orderSettings;
    if (os && (os.deliveryFee < 10 || os.freeDeliveryThreshold <= 30)) {
      os.deliveryFee = 40;
      os.minOrderAmount = 199;
      os.freeDeliveryThreshold = 499;
      if (os.swiggyUrl?.includes('ubereats')) os.swiggyUrl = 'https://www.swiggy.com';
      if (os.zomatoUrl?.includes('doordash')) os.zomatoUrl = 'https://www.zomato.com';
      changed = true;
    }

    // Upgrade menu items if they still have legacy USD prices (< 45)
    const defaultItemsMap = new Map(DEFAULT_RESTAURANT_DATA.items.map((i) => [i.id, i]));
    this.memoryData.items = this.memoryData.items.map((item) => {
      if (item.price < 45) {
        changed = true;
        const def = defaultItemsMap.get(item.id);
        if (def) {
          return {
            ...item,
            price: def.price,
            oldPrice: def.oldPrice,
          };
        }
        return {
          ...item,
          price: Math.round(item.price * 20),
          oldPrice: item.oldPrice ? Math.round(item.oldPrice * 20) : undefined,
        };
      }
      return item;
    });

    // Upgrade variants if they still have legacy USD prices (< 45)
    const defaultVariantsMap = new Map(DEFAULT_RESTAURANT_DATA.variants.map((v) => [v.id, v]));
    this.memoryData.variants = this.memoryData.variants.map((v) => {
      if (v.price < 45) {
        changed = true;
        const def = defaultVariantsMap.get(v.id);
        return {
          ...v,
          price: def ? def.price : Math.round(v.price * 20),
        };
      }
      return v;
    });

    // Upgrade addonGroups if options still have legacy USD prices (< 15)
    if (Array.isArray(this.memoryData.addonGroups)) {
      this.memoryData.addonGroups = this.memoryData.addonGroups.map((grp) => ({
        ...grp,
        options: grp.options.map((opt) => {
          if (opt.price < 15) {
            changed = true;
            const converted = opt.price <= 1.5 ? 40 : opt.price <= 2.5 ? 50 : 99;
            return { ...opt, price: converted };
          }
          return opt;
        }),
      }));
    }

    // Upgrade offers & specialDeal if they still contain '$'
    if (Array.isArray(this.memoryData.offers)) {
      this.memoryData.offers = this.memoryData.offers.map((off) => {
        if (
          off.description?.includes('$25') ||
          off.validUntil?.includes('$25') ||
          off.code === 'FREEDEL25'
        ) {
          changed = true;
          return {
            ...off,
            code: 'FREEDEL499',
            description: 'Free priority delivery across the city on all orders over ₹499.',
            validUntil: 'Orders Over ₹499',
          };
        }
        return off;
      });
    }

    const sd = this.memoryData.sectionContents?.specialDeal;
    if (sd && (sd.originalPrice?.includes('$') || sd.dealPrice?.includes('$'))) {
      sd.originalPrice = '₹499';
      sd.dealPrice = '₹349';
      changed = true;
    }

    if (changed) {
      this.saveToLocalStorage();
    }
  }

  private saveToLocalStorage() {
    this.lastLocalMutationAt = Date.now();
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryData));
    this.notifyListeners();
  }

  private saveConfigToLocalStorage() {
    safeStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.supabaseConfig));
    this.notifyListeners();
  }

  // Sync the extended site bundle (sectionContents, chefs, historyTimeline, blogPosts, socials, seo, openingHours, websiteSections, orderSettings, chatbotSettings) into restaurant_profile.site_bundle
  private pushSiteBundleToSupabase() {
    if (!this.supabaseClient || !this.supabaseConfig.isConnected) return;
    this.lastLocalMutationAt = Date.now();
    if (this.bundlePushTimer) {
      clearTimeout(this.bundlePushTimer);
    }
    this.bundlePushTimer = setTimeout(() => {
      if (!this.supabaseClient || !this.supabaseConfig.isConnected) return;
      this.lastLocalMutationAt = Date.now();
      const p = this.memoryData.profile;
      const siteBundle = {
        openingHours: this.memoryData.openingHours,
        websiteSections: this.memoryData.websiteSections,
        orderSettings: this.memoryData.orderSettings,
        sectionContents: this.memoryData.sectionContents,
        chefs: this.memoryData.chefs,
        historyTimeline: this.memoryData.historyTimeline,
        blogPosts: this.memoryData.blogPosts,
        socials: this.memoryData.socials,
        seo: this.memoryData.seo,
        addonGroups: this.memoryData.addonGroups,
        faqs: this.memoryData.faqs,
        chatbotSettings: this.memoryData.chatbotSettings,
        audioSettings: this.memoryData.audioSettings,
      };

      this.supabaseClient
        .from('restaurant_profile')
        .upsert({
          id: 'main',
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          story: p.story,
          logo_url: p.logoUrl,
          favicon_url: p.faviconUrl,
          hero_image_url: p.heroImageUrl,
          cuisine_type: p.cuisineType,
          price_range: p.priceRange,
          phone: p.phone,
          whatsapp_number: p.whatsappNumber,
          email: p.email,
          address: p.address,
          city: p.city,
          postal_code: p.postalCode,
          google_maps_url: p.googleMapsUrl,
          currency_symbol: p.currencySymbol,
          currency_code: p.currencyCode,
          theme_preset: p.themePreset,
          primary_color: p.primaryColor,
          secondary_color: p.secondaryColor,
          accent_color: p.accentColor,
          font_heading: p.fontHeading,
          font_body: p.fontBody,
          site_bundle: siteBundle,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase profile/bundle sync warning:', error.message);
        });
    }, 350);
  }

  // --- DATA ACCESSORS ---
  public getData(): RestaurantDatabaseBundle {
    return this.memoryData;
  }

  public getSupabaseConfig(): SupabaseConfig {
    return { ...this.supabaseConfig };
  }

  public isConnectedToSupabase(): boolean {
    return Boolean(this.supabaseConfig.isConnected && this.supabaseClient);
  }

  // --- SUPABASE VERIFICATION & CONNECTION ---
  public async testAndConnectSupabase(projectUrl: string, anonKey: string): Promise<VerificationResult> {
    const cleanUrl = projectUrl.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, message: 'Supabase project URL must begin with https://' };
    }
    if (cleanKey.length < 20) {
      return { success: false, message: 'Invalid Supabase publishable anon key provided.' };
    }

    try {
      const client = createClient(cleanUrl, cleanKey);

      const { data: verData, error: verError } = await client
        .from('schema_version')
        .select('version')
        .limit(1);

      if (verError) {
        return {
          success: false,
          message: `Connection successful, but database schema not found (${verError.message}). Please copy and run the generated SQL script in your Supabase SQL Editor first.`,
          details: { schema_version: false },
        };
      }

      const reportedVersion = verData?.[0]?.version || SCHEMA_VERSION;

      const tablesToCheck = ['restaurant_profile', 'menu_categories', 'menu_items', 'orders'];
      const missing: string[] = [];
      const details: Record<string, boolean> = { schema_version: true };

      for (const table of tablesToCheck) {
        const { error } = await client.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          missing.push(table);
          details[table] = false;
        } else {
          details[table] = true;
        }
      }

      if (missing.length > 0) {
        return {
          success: false,
          message: `Connected, but missing tables: ${missing.join(', ')}. Please run the complete SQL script in your Supabase SQL Editor.`,
          schemaVersion: reportedVersion,
          missingTables: missing,
          details,
        };
      }

      this.supabaseClient = client;
      this.supabaseConfig = {
        projectUrl: cleanUrl,
        anonKey: cleanKey,
        isConnected: true,
        lastVerifiedAt: new Date().toISOString(),
        schemaVersion: reportedVersion,
      };
      this.saveConfigToLocalStorage();
      this.setupRealtimeSubscription();

      // Hydrate from Supabase or push initial data if Supabase is empty
      await this.syncFromSupabase();
      await this.pushAllToSupabase();

      return {
        success: true,
        message: `Connected to Supabase (${reportedVersion}) with Live Realtime Sync enabled!`,
        schemaVersion: reportedVersion,
        details,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Supabase connection failed: ${errorMsg}. Check your Project URL and Anon Key.`,
      };
    }
  }

  public disconnectSupabase() {
    if (this.supabaseClient && this.realtimeChannel) {
      this.supabaseClient.removeChannel(this.realtimeChannel);
    }
    this.realtimeChannel = null;
    this.supabaseClient = null;
    this.supabaseConfig = {
      projectUrl: '',
      anonKey: '',
      isConnected: false,
    };
    this.saveConfigToLocalStorage();
  }

  // Push current state to Supabase
  public async pushAllToSupabase(): Promise<boolean> {
    if (!this.supabaseClient || !this.supabaseConfig.isConnected) return false;
    try {
      this.pushSiteBundleToSupabase();

      if (this.memoryData.categories.length > 0) {
        await this.supabaseClient.from('menu_categories').upsert(
          this.memoryData.categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            display_order: c.displayOrder,
            is_active: c.isActive,
            icon_name: c.iconName || 'Utensils',
            image_url: c.imageUrl || '',
            item_count_label: c.itemCountLabel || '',
          }))
        );
      }

      if (this.memoryData.items.length > 0) {
        await this.supabaseClient.from('menu_items').upsert(
          this.memoryData.items.map((item) => ({
            id: item.id,
            category_id: item.categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            old_price: item.oldPrice ?? null,
            is_veg: item.isVeg,
            is_bestseller: item.isBestseller,
            spice_level: item.spiceLevel,
            stock_status: item.stockStatus,
            image_url: item.imageUrl || '',
            display_order: item.displayOrder,
            has_variants: item.hasVariants,
            has_addons: item.hasAddons,
            portion_info: item.portionInfo || '',
            calories: item.calories || '',
            prep_time: item.prepTime || '',
            rating: item.rating ?? 4.9,
            reviews_count: item.reviewsCount ?? 100,
            tags: item.tags || [],
            updated_at: new Date().toISOString(),
          }))
        );
      }

      if (this.memoryData.offers.length > 0) {
        await this.supabaseClient.from('special_offers').upsert(
          this.memoryData.offers.map((o) => ({
            id: o.id,
            title: o.title,
            code: o.code,
            description: o.description,
            discount_badge: o.discountBadge,
            valid_until: o.validUntil,
            is_active: o.isActive,
          }))
        );
      }

      if (this.memoryData.gallery.length > 0) {
        await this.supabaseClient.from('gallery_items').upsert(
          this.memoryData.gallery.map((g) => ({
            id: g.id,
            title: g.title,
            description: g.description || '',
            category: g.category,
            image_url: g.imageUrl,
            display_order: g.displayOrder,
          }))
        );
      }

      if (this.memoryData.testimonials.length > 0) {
        await this.supabaseClient.from('testimonials').upsert(
          this.memoryData.testimonials.map((t) => ({
            id: t.id,
            author: t.author,
            rating: t.rating,
            review_text: t.reviewText,
            source: t.source,
            date: t.date,
            dish_recommended: t.dishRecommended || '',
            avatar_url: t.avatarUrl || '',
          }))
        );
      }

      return true;
    } catch (err) {
      console.warn('Push all to Supabase warning:', err);
      return false;
    }
  }

  // --- SYNC FROM SUPABASE TO LOCAL CACHE ---
  public async syncFromSupabase(): Promise<boolean> {
    if (!this.supabaseClient) return false;

    try {
      const [
        profileRes,
        categoriesRes,
        itemsRes,
        variantsRes,
        galleryRes,
        testimonialsRes,
        offersRes,
        ordersRes,
        reservationsRes,
        messagesRes,
        inquiriesRes,
      ] = await Promise.all([
        this.supabaseClient.from('restaurant_profile').select('*').limit(1).maybeSingle(),
        this.supabaseClient.from('menu_categories').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('menu_items').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('item_variants').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('gallery_items').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('testimonials').select('*'),
        this.supabaseClient.from('special_offers').select('*'),
        this.supabaseClient.from('orders').select('*').order('created_at', { ascending: false }),
        this.supabaseClient.from('table_reservations').select('*').order('created_at', { ascending: false }),
        this.supabaseClient.from('contact_messages').select('*').order('created_at', { ascending: false }),
        this.supabaseClient.from('party_inquiries').select('*').order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        this.memoryData.profile = {
          ...this.memoryData.profile,
          name: p.name || this.memoryData.profile.name,
          tagline: p.tagline || this.memoryData.profile.tagline,
          description: p.description || this.memoryData.profile.description,
          story: p.story || this.memoryData.profile.story,
          logoUrl: p.logo_url ?? this.memoryData.profile.logoUrl,
          faviconUrl: p.favicon_url ?? this.memoryData.profile.faviconUrl,
          heroImageUrl: p.hero_image_url ?? this.memoryData.profile.heroImageUrl,
          cuisineType: p.cuisine_type || this.memoryData.profile.cuisineType,
          priceRange: p.price_range || this.memoryData.profile.priceRange,
          phone: p.phone || this.memoryData.profile.phone,
          whatsappNumber: p.whatsapp_number || this.memoryData.profile.whatsappNumber,
          email: p.email || this.memoryData.profile.email,
          address: p.address || this.memoryData.profile.address,
          city: p.city || this.memoryData.profile.city,
          postalCode: p.postal_code || this.memoryData.profile.postalCode,
          googleMapsUrl: p.google_maps_url || this.memoryData.profile.googleMapsUrl,
          currencySymbol: p.currency_symbol || this.memoryData.profile.currencySymbol,
          currencyCode: p.currency_code || this.memoryData.profile.currencyCode,
          primaryColor: p.primary_color || this.memoryData.profile.primaryColor,
          secondaryColor: p.secondary_color || this.memoryData.profile.secondaryColor,
          accentColor: p.accent_color || this.memoryData.profile.accentColor,
          fontHeading: p.font_heading || this.memoryData.profile.fontHeading,
          fontBody: p.font_body || this.memoryData.profile.fontBody,
        };

        if (p.site_bundle && typeof p.site_bundle === 'object') {
          const b = p.site_bundle as any;
          if (b.openingHours) this.memoryData.openingHours = { ...this.memoryData.openingHours, ...b.openingHours };
          if (b.websiteSections) this.memoryData.websiteSections = { ...this.memoryData.websiteSections, ...b.websiteSections };
          if (b.orderSettings) this.memoryData.orderSettings = { ...this.memoryData.orderSettings, ...b.orderSettings };
          if (b.sectionContents) this.memoryData.sectionContents = { ...this.memoryData.sectionContents!, ...b.sectionContents };
          if (Array.isArray(b.chefs)) this.memoryData.chefs = b.chefs;
          if (Array.isArray(b.historyTimeline)) this.memoryData.historyTimeline = b.historyTimeline;
          if (Array.isArray(b.blogPosts)) this.memoryData.blogPosts = b.blogPosts;
          if (b.socials) this.memoryData.socials = { ...this.memoryData.socials, ...b.socials };
          if (b.seo) this.memoryData.seo = { ...this.memoryData.seo, ...b.seo };
          if (Array.isArray(b.addonGroups)) this.memoryData.addonGroups = b.addonGroups;
          if (Array.isArray(b.faqs)) this.memoryData.faqs = b.faqs;
          if (b.chatbotSettings) {
            this.memoryData.chatbotSettings = {
              ...DEFAULT_RESTAURANT_DATA.chatbotSettings!,
              ...this.memoryData.chatbotSettings,
              ...b.chatbotSettings,
            };
          }
          if (b.audioSettings) {
            this.memoryData.audioSettings = {
              ...DEFAULT_RESTAURANT_DATA.audioSettings!,
              ...this.memoryData.audioSettings,
              ...b.audioSettings,
            };
          }
        }
      }

      if (categoriesRes.data && categoriesRes.data.length > 0) {
        this.memoryData.categories = categoriesRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          displayOrder: c.display_order ?? 0,
          isActive: c.is_active ?? true,
          iconName: c.icon_name || 'Utensils',
          imageUrl: c.image_url || '',
          itemCountLabel: c.item_count_label || '',
        }));
      }

      if (itemsRes.data && itemsRes.data.length > 0) {
        this.memoryData.items = itemsRes.data.map((i: any) => ({
          id: i.id,
          categoryId: i.category_id,
          name: i.name,
          description: i.description || '',
          price: Number(i.price),
          oldPrice: i.old_price ? Number(i.old_price) : undefined,
          isVeg: i.is_veg ?? true,
          isBestseller: i.is_bestseller ?? false,
          spiceLevel: (i.spice_level ?? 1) as 0 | 1 | 2 | 3,
          stockStatus: (i.stock_status || 'available') as StockStatus,
          imageUrl: i.image_url || '',
          displayOrder: i.display_order ?? 0,
          hasVariants: i.has_variants ?? false,
          hasAddons: i.has_addons ?? false,
          portionInfo: i.portion_info || '',
          calories: i.calories || '',
          prepTime: i.prep_time || '',
          rating: i.rating ? Number(i.rating) : 4.9,
          reviewsCount: i.reviews_count ? Number(i.reviews_count) : 100,
          tags: i.tags || [],
        }));
      }

      if (variantsRes.data && variantsRes.data.length > 0) {
        this.memoryData.variants = variantsRes.data.map((v: any) => ({
          id: v.id,
          menuItemId: v.menu_item_id,
          name: v.name,
          price: Number(v.price),
          isAvailable: v.is_available ?? true,
          displayOrder: v.display_order ?? 0,
        }));
      }

      if (galleryRes.data && galleryRes.data.length > 0) {
        this.memoryData.gallery = galleryRes.data.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description || '',
          category: g.category || 'food',
          imageUrl: g.image_url,
          displayOrder: g.display_order ?? 0,
        }));
      }

      if (testimonialsRes.data && testimonialsRes.data.length > 0) {
        this.memoryData.testimonials = testimonialsRes.data.map((t: any) => ({
          id: t.id,
          author: t.author,
          rating: Number(t.rating ?? 5),
          reviewText: t.review_text,
          source: t.source || 'Customer',
          date: t.date || 'Recent',
          dishRecommended: t.dish_recommended || '',
          avatarUrl: t.avatar_url || '',
        }));
      }

      if (offersRes.data && offersRes.data.length > 0) {
        this.memoryData.offers = offersRes.data.map((o: any) => ({
          id: o.id,
          title: o.title,
          code: o.code,
          description: o.description,
          discountBadge: o.discount_badge,
          validUntil: o.valid_until || '',
          isActive: o.is_active ?? true,
        }));
      }

      if (ordersRes.data) {
        this.memoryData.orders = ordersRes.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          createdAt: o.created_at,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          orderType: o.order_type || 'delivery',
          deliveryAddress: o.delivery_address || '',
          deliveryLandmark: o.delivery_landmark || '',
          specialInstructions: o.special_instructions || '',
          items: Array.isArray(o.items) ? o.items : [],
          subtotal: Number(o.subtotal || 0),
          deliveryFee: Number(o.delivery_fee || 0),
          total: Number(o.total || 0),
          channel: o.channel || 'admin',
          status: (o.status || 'pending') as OrderStatus,
          notes: o.notes || '',
        }));
      }

      if (reservationsRes.data) {
        this.memoryData.reservations = reservationsRes.data.map((r: any) => ({
          id: r.id,
          createdAt: r.created_at,
          guestName: r.guest_name,
          guestEmail: r.guest_email || '',
          guestPhone: r.guest_phone,
          partySize: r.party_size || '2 People',
          reservationDate: r.reservation_date,
          reservationTime: r.reservation_time,
          specialRequest: r.special_request || '',
          status: (r.status || 'pending') as ReservationStatus,
        }));
      }

      if (messagesRes.data) {
        this.memoryData.contactMessages = messagesRes.data.map((m: any) => ({
          id: m.id,
          createdAt: m.created_at,
          name: m.name,
          email: m.email,
          subject: m.subject || '',
          message: m.message,
          isRead: m.is_read ?? false,
        }));
      }

      if (inquiriesRes.data) {
        this.memoryData.partyInquiries = inquiriesRes.data.map((inq: any) => ({
          id: inq.id,
          guestCount: Number(inq.guest_count || 10),
          eventDate: inq.event_date,
          eventType: inq.event_type || 'Other',
          name: inq.name,
          phone: inq.phone,
          requirements: inq.requirements || '',
          createdAt: inq.created_at,
        }));
      }

      this.saveToLocalStorage();
      return true;
    } catch (err) {
      console.warn('Sync from Supabase failed:', err);
      return false;
    }
  }

  // --- MUTATION METHODS ---
  public updateProfile(profile: Partial<RestaurantProfile>) {
    this.memoryData.profile = { ...this.memoryData.profile, ...profile };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateSections(sections: Partial<WebsiteSections>) {
    this.memoryData.websiteSections = { ...this.memoryData.websiteSections, ...sections };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateSectionContents(contents: Partial<SectionContents>) {
    if (!this.memoryData.sectionContents) {
      this.memoryData.sectionContents = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA.sectionContents));
    }
    this.memoryData.sectionContents = {
      ...this.memoryData.sectionContents!,
      ...contents,
    };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateOrderSettings(settings: Partial<OrderSettings>) {
    this.memoryData.orderSettings = { ...this.memoryData.orderSettings, ...settings };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateOpeningHours(hours: Partial<OpeningHours>) {
    this.memoryData.openingHours = { ...this.memoryData.openingHours, ...hours };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateSocials(socials: Partial<SocialLinks>) {
    this.memoryData.socials = { ...this.memoryData.socials, ...socials };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateSEO(seo: Partial<SEOSettings>) {
    this.memoryData.seo = { ...this.memoryData.seo, ...seo };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateChatbotSettings(settings: Partial<ChatbotSettings>) {
    this.memoryData.chatbotSettings = {
      ...DEFAULT_RESTAURANT_DATA.chatbotSettings!,
      ...(this.memoryData.chatbotSettings || {}),
      ...settings,
    };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public updateAudioSettings(settings: Partial<AudioSettings>) {
    this.memoryData.audioSettings = {
      ...DEFAULT_RESTAURANT_DATA.audioSettings!,
      ...(this.memoryData.audioSettings || {}),
      ...settings,
    };
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  // Categories
  public saveCategory(category: MenuCategory) {
    const idx = this.memoryData.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.memoryData.categories[idx] = category;
    } else {
      this.memoryData.categories.push(category);
    }
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('menu_categories')
        .upsert({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          display_order: category.displayOrder,
          is_active: category.isActive,
          icon_name: category.iconName || 'Utensils',
          image_url: category.imageUrl || '',
          item_count_label: category.itemCountLabel || '',
        })
        .then(({ error }) => {
          if (error) console.error('Supabase category save error:', error.message);
        });
    }
  }

  public deleteCategory(categoryId: string) {
    this.memoryData.categories = this.memoryData.categories.filter((c) => c.id !== categoryId);
    this.memoryData.items = this.memoryData.items.filter((i) => i.categoryId !== categoryId);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('menu_categories').delete().eq('id', categoryId).then();
    }
  }

  // Items
  public saveItem(item: MenuItem) {
    const idx = this.memoryData.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.memoryData.items[idx] = item;
    } else {
      this.memoryData.items.push(item);
    }
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('menu_items')
        .upsert({
          id: item.id,
          category_id: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          old_price: item.oldPrice ?? null,
          is_veg: item.isVeg,
          is_bestseller: item.isBestseller,
          spice_level: item.spiceLevel,
          stock_status: item.stockStatus,
          image_url: item.imageUrl || '',
          display_order: item.displayOrder,
          has_variants: item.hasVariants,
          has_addons: item.hasAddons,
          portion_info: item.portionInfo || '',
          calories: item.calories || '',
          prep_time: item.prepTime || '',
          rating: item.rating ?? 4.9,
          reviews_count: item.reviewsCount ?? 100,
          tags: item.tags || [],
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error('Supabase item save error:', error.message);
        });
    }
  }

  public deleteItem(itemId: string) {
    this.memoryData.items = this.memoryData.items.filter((i) => i.id !== itemId);
    this.memoryData.variants = this.memoryData.variants.filter((v) => v.menuItemId !== itemId);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('menu_items').delete().eq('id', itemId).then();
    }
  }

  public setItemStockStatus(itemId: string, status: StockStatus) {
    const item = this.memoryData.items.find((i) => i.id === itemId);
    if (item) {
      item.stockStatus = status;
      this.saveToLocalStorage();

      if (this.supabaseClient && this.supabaseConfig.isConnected) {
        this.supabaseClient
          .from('menu_items')
          .update({ stock_status: status, updated_at: new Date().toISOString() })
          .eq('id', itemId)
          .then();
      }
    }
  }

  // Variants
  public saveVariant(variant: ItemVariant) {
    const idx = this.memoryData.variants.findIndex((v) => v.id === variant.id);
    if (idx >= 0) {
      this.memoryData.variants[idx] = variant;
    } else {
      this.memoryData.variants.push(variant);
    }
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('item_variants')
        .upsert({
          id: variant.id,
          menu_item_id: variant.menuItemId,
          name: variant.name,
          price: variant.price,
          is_available: variant.isAvailable,
          display_order: variant.displayOrder,
        })
        .then();
    }
  }

  public deleteVariant(variantId: string) {
    this.memoryData.variants = this.memoryData.variants.filter((v) => v.id !== variantId);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('item_variants').delete().eq('id', variantId).then();
    }
  }

  // Addon Groups
  public saveAddonGroup(group: AddonGroup) {
    const idx = this.memoryData.addonGroups.findIndex((g) => g.id === group.id);
    if (idx >= 0) {
      this.memoryData.addonGroups[idx] = group;
    } else {
      this.memoryData.addonGroups.push(group);
    }
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public deleteAddonGroup(groupId: string) {
    this.memoryData.addonGroups = this.memoryData.addonGroups.filter((g) => g.id !== groupId);
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  // Gallery
  public saveGalleryItem(item: GalleryItem) {
    const idx = this.memoryData.gallery.findIndex((g) => g.id === item.id);
    if (idx >= 0) {
      this.memoryData.gallery[idx] = item;
    } else {
      this.memoryData.gallery.push(item);
    }
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('gallery_items')
        .upsert({
          id: item.id,
          title: item.title,
          description: item.description || '',
          category: item.category,
          image_url: item.imageUrl,
          display_order: item.displayOrder,
        })
        .then();
    }
  }

  public deleteGalleryItem(id: string) {
    this.memoryData.gallery = this.memoryData.gallery.filter((g) => g.id !== id);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('gallery_items').delete().eq('id', id).then();
    }
  }

  // Testimonials
  public saveTestimonial(t: Testimonial) {
    const idx = this.memoryData.testimonials.findIndex((item) => item.id === t.id);
    if (idx >= 0) {
      this.memoryData.testimonials[idx] = t;
    } else {
      this.memoryData.testimonials.push(t);
    }
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('testimonials')
        .upsert({
          id: t.id,
          author: t.author,
          rating: t.rating,
          review_text: t.reviewText,
          source: t.source,
          date: t.date,
          dish_recommended: t.dishRecommended || '',
          avatar_url: t.avatarUrl || '',
        })
        .then();
    }
  }

  public deleteTestimonial(id: string) {
    this.memoryData.testimonials = this.memoryData.testimonials.filter((t) => t.id !== id);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('testimonials').delete().eq('id', id).then();
    }
  }

  // Special Offers
  public saveOffer(offer: SpecialOffer) {
    const idx = this.memoryData.offers.findIndex((o) => o.id === offer.id);
    if (idx >= 0) {
      this.memoryData.offers[idx] = offer;
    } else {
      this.memoryData.offers.push(offer);
    }
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('special_offers')
        .upsert({
          id: offer.id,
          title: offer.title,
          code: offer.code,
          description: offer.description,
          discount_badge: offer.discountBadge,
          valid_until: offer.validUntil,
          is_active: offer.isActive,
        })
        .then();
    }
  }

  public deleteOffer(id: string) {
    this.memoryData.offers = this.memoryData.offers.filter((o) => o.id !== id);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('special_offers').delete().eq('id', id).then();
    }
  }

  // FAQs
  public saveFAQ(faq: FAQItem) {
    const idx = this.memoryData.faqs.findIndex((f) => f.id === faq.id);
    if (idx >= 0) {
      this.memoryData.faqs[idx] = faq;
    } else {
      this.memoryData.faqs.push(faq);
    }
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public deleteFAQ(id: string) {
    this.memoryData.faqs = this.memoryData.faqs.filter((f) => f.id !== id);
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  // Chefs CRUD
  public saveChef(chef: ChefProfile) {
    const list = this.memoryData.chefs || [];
    const idx = list.findIndex((c) => c.id === chef.id);
    if (idx >= 0) {
      list[idx] = chef;
    } else {
      list.push(chef);
    }
    this.memoryData.chefs = [...list];
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public deleteChef(id: string) {
    this.memoryData.chefs = (this.memoryData.chefs || []).filter((c) => c.id !== id);
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  // History Timeline CRUD
  public saveTimelineEvent(event: TimelineEvent) {
    const list = this.memoryData.historyTimeline || [];
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      list[idx] = event;
    } else {
      list.push(event);
    }
    this.memoryData.historyTimeline = [...list];
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public deleteTimelineEvent(id: string) {
    this.memoryData.historyTimeline = (this.memoryData.historyTimeline || []).filter((e) => e.id !== id);
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  // Blog Posts CRUD
  public saveBlogPost(post: BlogPostItem) {
    const list = this.memoryData.blogPosts || [];
    const idx = list.findIndex((b) => b.id === post.id);
    if (idx >= 0) {
      list[idx] = post;
    } else {
      list.unshift(post);
    }
    this.memoryData.blogPosts = [...list];
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  public deleteBlogPost(id: string) {
    this.memoryData.blogPosts = (this.memoryData.blogPosts || []).filter((b) => b.id !== id);
    this.saveToLocalStorage();
    this.pushSiteBundleToSupabase();
  }

  // Party & Catering Inquiries
  public async submitPartyInquiry(inquiry: Omit<PartyInquiry, 'id' | 'createdAt'>): Promise<boolean> {
    const newInquiry: PartyInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const current = this.memoryData.partyInquiries || [];
    this.memoryData.partyInquiries = [newInquiry, ...current];
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      try {
        await this.supabaseClient.from('party_inquiries').insert({
          id: newInquiry.id,
          guest_count: newInquiry.guestCount,
          event_date: newInquiry.eventDate,
          event_type: newInquiry.eventType,
          name: newInquiry.name,
          phone: newInquiry.phone,
          requirements: newInquiry.requirements,
          created_at: newInquiry.createdAt,
        });
      } catch (e) {
        console.warn('Failed to insert party inquiry to Supabase:', e);
      }
    }

    return true;
  }

  // --- TABLE RESERVATIONS (#reservation) ---
  public addReservation(
    input: Omit<TableReservation, 'id' | 'createdAt' | 'status'>
  ): TableReservation {
    const created: TableReservation = {
      ...input,
      id: `res-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const current = this.memoryData.reservations || [];
    this.memoryData.reservations = [created, ...current];
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('table_reservations')
        .insert({
          id: created.id,
          guest_name: created.guestName,
          guest_email: created.guestEmail || '',
          guest_phone: created.guestPhone,
          party_size: created.partySize,
          reservation_date: created.reservationDate,
          reservation_time: created.reservationTime,
          special_request: created.specialRequest || '',
          status: created.status,
          created_at: created.createdAt,
        })
        .then();
    }

    return created;
  }

  public updateReservationStatus(id: string, status: ReservationStatus) {
    this.memoryData.reservations = (this.memoryData.reservations || []).map((r) =>
      r.id === id ? { ...r, status } : r
    );
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('table_reservations')
        .update({ status })
        .eq('id', id)
        .then();
    }
  }

  public deleteReservation(id: string) {
    this.memoryData.reservations = (this.memoryData.reservations || []).filter((r) => r.id !== id);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('table_reservations').delete().eq('id', id).then();
    }
  }

  // --- CONTACT MESSAGES (#contact-section) ---
  public addContactMessage(
    input: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>
  ): ContactMessage {
    const created: ContactMessage = {
      ...input,
      id: `msg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const current = this.memoryData.contactMessages || [];
    this.memoryData.contactMessages = [created, ...current];
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient
        .from('contact_messages')
        .insert({
          id: created.id,
          name: created.name,
          email: created.email,
          subject: created.subject || '',
          message: created.message,
          is_read: false,
          created_at: created.createdAt,
        })
        .then();
    }

    return created;
  }

  public deleteContactMessage(id: string) {
    this.memoryData.contactMessages = (this.memoryData.contactMessages || []).filter(
      (m) => m.id !== id
    );
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      this.supabaseClient.from('contact_messages').delete().eq('id', id).then();
    }
  }

  // --- ORDERS MANAGEMENT (WHATSAPP & ADMIN PANEL CHANNELS) ---
  public getOrders(): Order[] {
    return this.memoryData.orders || [];
  }

  public addOrder(orderInput: Partial<Order> & {
    customerName: string;
    customerPhone: string;
    orderType: any;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    channel: 'whatsapp' | 'admin';
  }): Order {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: orderInput.id || `ord-${Date.now()}-${randomSuffix}`,
      orderNumber: orderInput.orderNumber || `ORD-${randomSuffix}`,
      createdAt: orderInput.createdAt || new Date().toISOString(),
      customerName: orderInput.customerName,
      customerPhone: orderInput.customerPhone,
      orderType: orderInput.orderType || 'delivery',
      deliveryAddress: orderInput.deliveryAddress || '',
      deliveryLandmark: orderInput.deliveryLandmark || '',
      specialInstructions: orderInput.specialInstructions || '',
      items: orderInput.items || [],
      subtotal: orderInput.subtotal || 0,
      deliveryFee: orderInput.deliveryFee || 0,
      total: orderInput.total || 0,
      channel: orderInput.channel || 'admin',
      status: (orderInput.status as OrderStatus) || 'pending',
      notes: orderInput.notes || '',
    };

    const currentOrders = this.memoryData.orders || [];
    this.memoryData.orders = [newOrder, ...currentOrders];
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      try {
        this.supabaseClient
          .from('orders')
          .insert({
            id: newOrder.id,
            order_number: newOrder.orderNumber,
            customer_name: newOrder.customerName,
            customer_phone: newOrder.customerPhone,
            order_type: newOrder.orderType,
            delivery_address: newOrder.deliveryAddress,
            delivery_landmark: newOrder.deliveryLandmark,
            special_instructions: newOrder.specialInstructions,
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            delivery_fee: newOrder.deliveryFee,
            total: newOrder.total,
            channel: newOrder.channel,
            status: newOrder.status,
            notes: newOrder.notes,
            created_at: newOrder.createdAt,
          })
          .then(() => {}, () => {});
      } catch (err) {
        console.warn('Could not sync order to Supabase:', err);
      }
    }

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): void {
    if (!this.memoryData.orders) return;
    this.memoryData.orders = this.memoryData.orders.map((o) =>
      o.id === orderId ? { ...o, status } : o
    );
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      try {
        this.supabaseClient
          .from('orders')
          .update({ status })
          .eq('id', orderId)
          .then(() => {}, () => {});
      } catch (err) {
        console.warn('Could not update order status in Supabase:', err);
      }
    }
  }

  public deleteOrder(orderId: string): void {
    if (!this.memoryData.orders) return;
    this.memoryData.orders = this.memoryData.orders.filter((o) => o.id !== orderId);
    this.saveToLocalStorage();

    if (this.supabaseClient && this.supabaseConfig.isConnected) {
      try {
        this.supabaseClient
          .from('orders')
          .delete()
          .eq('id', orderId)
          .then(() => {}, () => {});
      } catch (err) {
        console.warn('Could not delete order from Supabase:', err);
      }
    }
  }

  public clearOrders(): void {
    this.memoryData.orders = [];
    this.saveToLocalStorage();
  }

  // --- BACKUP & EXPORT/IMPORT ---
  public exportDatabaseBundle(): string {
    const exportBundle: RestaurantDatabaseBundle = {
      ...this.memoryData,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportBundle, null, 2);
  }

  public importDatabaseBundle(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profile || !parsed.items || !parsed.categories) {
        return {
          success: false,
          error: 'Invalid configuration format: Missing required profile, categories, or items.',
        };
      }
      this.memoryData = {
        ...DEFAULT_RESTAURANT_DATA,
        ...parsed,
        version: SCHEMA_VERSION,
      };
      this.saveToLocalStorage();
      this.pushAllToSupabase();
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON file';
      return { success: false, error: msg };
    }
  }

  public resetToDemoDefaults() {
    this.memoryData = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA));
    this.saveToLocalStorage();
    this.pushAllToSupabase();
  }
}

export const dataProvider = new DataProviderService();
