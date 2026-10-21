import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
} from '../types';
import { DEFAULT_RESTAURANT_DATA } from '../data/defaultRestaurantData';
import { SCHEMA_VERSION } from './sqlGenerator';
import { safeStorage } from './storage';

const STORAGE_KEY = 'restaurant_master_template_data_v1';
const SUPABASE_CONFIG_KEY = 'restaurant_supabase_config_v1';

export interface VerificationResult {
  success: boolean;
  message: string;
  schemaVersion?: string;
  missingTables?: string[];
  details?: Record<string, boolean>;
}

class DataProviderService {
  private memoryData: RestaurantDatabaseBundle;
  private supabaseClient: SupabaseClient | null = null;
  private supabaseConfig: SupabaseConfig;

  constructor() {
    // 1. Initialize Supabase Config from safe storage or defaults
    const savedConfig = safeStorage.getItem(SUPABASE_CONFIG_KEY);
    if (savedConfig) {
      try {
        this.supabaseConfig = JSON.parse(savedConfig);
      } catch {
        this.supabaseConfig = { projectUrl: '', anonKey: '', isConnected: false };
      }
    } else {
      this.supabaseConfig = { projectUrl: '', anonKey: '', isConnected: false };
    }

    // 2. Initialize Restaurant Data from safe storage or defaults
    const savedData = safeStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        this.memoryData = JSON.parse(savedData);
      } catch {
        this.memoryData = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA));
      }
    } else {
      this.memoryData = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA));
      this.saveToLocalStorage();
    }

    // 3. Connect to Supabase if config is active
    if (this.supabaseConfig.isConnected && this.supabaseConfig.projectUrl && this.supabaseConfig.anonKey) {
      try {
        this.supabaseClient = createClient(this.supabaseConfig.projectUrl, this.supabaseConfig.anonKey);
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
  }

  // --- LOCAL STORAGE HELPERS ---
  private saveToLocalStorage() {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryData));
  }

  private saveConfigToLocalStorage() {
    safeStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.supabaseConfig));
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

      // Verify schema version table
      const { data: verData, error: verError } = await client
        .from('schema_version')
        .select('version')
        .limit(1);

      if (verError) {
        return {
          success: false,
          message: `Connection successful, but database schema not found (${verError.message}). Please execute the generated SQL script in your Supabase SQL Editor.`,
          details: { schema_version: false },
        };
      }

      const reportedVersion = verData?.[0]?.version || 'unknown';

      // Verify core required tables
      const tablesToCheck = ['restaurant_profile', 'menu_categories', 'menu_items', 'order_settings'];
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
          message: `Connected, but missing expected tables: ${missing.join(', ')}. Please run the complete SQL script in your Supabase SQL editor.`,
          schemaVersion: reportedVersion,
          missingTables: missing,
          details,
        };
      }

      // Successful verification
      this.supabaseClient = client;
      this.supabaseConfig = {
        projectUrl: cleanUrl,
        anonKey: cleanKey,
        isConnected: true,
        lastVerifiedAt: new Date().toISOString(),
        schemaVersion: reportedVersion,
      };
      this.saveConfigToLocalStorage();

      // Try initial hydration from Supabase
      await this.syncFromSupabase();

      return {
        success: true,
        message: `Successfully connected to Supabase and verified schema version ${reportedVersion}!`,
        schemaVersion: reportedVersion,
        details,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Supabase connection failed: ${errorMsg}. Double check your Project URL and Publishable Anon Key.`,
      };
    }
  }

  public disconnectSupabase() {
    this.supabaseClient = null;
    this.supabaseConfig = {
      projectUrl: '',
      anonKey: '',
      isConnected: false,
    };
    this.saveConfigToLocalStorage();
  }

  // --- SYNC FROM SUPABASE TO LOCAL CACHE ---
  public async syncFromSupabase(): Promise<boolean> {
    if (!this.supabaseClient) return false;

    try {
      const [
        profileRes,
        hoursRes,
        sectionsRes,
        orderRes,
        categoriesRes,
        itemsRes,
        variantsRes,
        addonsRes,
      ] = await Promise.all([
        this.supabaseClient.from('restaurant_profile').select('*').limit(1).maybeSingle(),
        this.supabaseClient.from('opening_hours').select('*').limit(1).maybeSingle(),
        this.supabaseClient.from('website_sections').select('*').limit(1).maybeSingle(),
        this.supabaseClient.from('order_settings').select('*').limit(1).maybeSingle(),
        this.supabaseClient.from('menu_categories').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('menu_items').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('item_variants').select('*').order('display_order', { ascending: true }),
        this.supabaseClient.from('addon_groups').select('*'),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        this.memoryData.profile = {
          ...this.memoryData.profile,
          name: p.name || this.memoryData.profile.name,
          tagline: p.tagline || this.memoryData.profile.tagline,
          description: p.description || this.memoryData.profile.description,
          story: p.story || this.memoryData.profile.story,
          phone: p.phone || this.memoryData.profile.phone,
          whatsappNumber: p.whatsapp_number || this.memoryData.profile.whatsappNumber,
          email: p.email || this.memoryData.profile.email,
          address: p.address || this.memoryData.profile.address,
          city: p.city || this.memoryData.profile.city,
          postalCode: p.postal_code || this.memoryData.profile.postalCode,
          googleMapsUrl: p.google_maps_url || this.memoryData.profile.googleMapsUrl,
          primaryColor: p.primary_color || this.memoryData.profile.primaryColor,
          secondaryColor: p.secondary_color || this.memoryData.profile.secondaryColor,
          accentColor: p.accent_color || this.memoryData.profile.accentColor,
          fontHeading: p.font_heading || this.memoryData.profile.fontHeading,
          fontBody: p.font_body || this.memoryData.profile.fontBody,
        };
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
        }));
      }

      if (itemsRes.data && itemsRes.data.length > 0) {
        this.memoryData.items = itemsRes.data.map((i: any) => ({
          id: i.id,
          categoryId: i.category_id,
          name: i.name,
          description: i.description || '',
          price: Number(i.price),
          isVeg: i.is_veg ?? true,
          isBestseller: i.is_bestseller ?? false,
          spiceLevel: (i.spice_level ?? 1) as 0 | 1 | 2 | 3,
          stockStatus: (i.stock_status || 'available') as StockStatus,
          imageUrl: i.image_url || '',
          displayOrder: i.display_order ?? 0,
          hasVariants: i.has_variants ?? false,
          hasAddons: i.has_addons ?? false,
          portionInfo: i.portion_info || '',
          tags: i.tags || [],
        }));
      }

      if (variantsRes.data) {
        this.memoryData.variants = variantsRes.data.map((v: any) => ({
          id: v.id,
          menuItemId: v.menu_item_id,
          name: v.name,
          price: Number(v.price),
          isAvailable: v.is_available ?? true,
          displayOrder: v.display_order ?? 0,
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

    // Async push to Supabase if connected
    if (this.supabaseClient) {
      const p = this.memoryData.profile;
      this.supabaseClient
        .from('restaurant_profile')
        .upsert({
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          story: p.story,
          logo_url: p.logoUrl,
          favicon_url: p.faviconUrl,
          hero_image_url: p.heroImageUrl,
          phone: p.phone,
          whatsapp_number: p.whatsappNumber,
          email: p.email,
          address: p.address,
          city: p.city,
          postal_code: p.postalCode,
          google_maps_url: p.googleMapsUrl,
          currency_symbol: p.currencySymbol,
          theme_preset: p.themePreset,
          primary_color: p.primaryColor,
          secondary_color: p.secondaryColor,
          accent_color: p.accentColor,
          font_heading: p.fontHeading,
          font_body: p.fontBody,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error('Supabase profile update error:', error.message);
        });
    }
  }

  public updateSections(sections: Partial<WebsiteSections>) {
    this.memoryData.websiteSections = { ...this.memoryData.websiteSections, ...sections };
    this.saveToLocalStorage();
  }

  public updateOrderSettings(settings: Partial<OrderSettings>) {
    this.memoryData.orderSettings = { ...this.memoryData.orderSettings, ...settings };
    this.saveToLocalStorage();
  }

  public updateOpeningHours(hours: Partial<OpeningHours>) {
    this.memoryData.openingHours = { ...this.memoryData.openingHours, ...hours };
    this.saveToLocalStorage();
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

    if (this.supabaseClient) {
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

    if (this.supabaseClient) {
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

    if (this.supabaseClient) {
      this.supabaseClient
        .from('menu_items')
        .upsert({
          id: item.id,
          category_id: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          is_veg: item.isVeg,
          is_bestseller: item.isBestseller,
          spice_level: item.spiceLevel,
          stock_status: item.stockStatus,
          image_url: item.imageUrl || '',
          display_order: item.displayOrder,
          has_variants: item.hasVariants,
          has_addons: item.hasAddons,
          portion_info: item.portionInfo || '',
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

    if (this.supabaseClient) {
      this.supabaseClient.from('menu_items').delete().eq('id', itemId).then();
    }
  }

  public setItemStockStatus(itemId: string, status: StockStatus) {
    const item = this.memoryData.items.find((i) => i.id === itemId);
    if (item) {
      item.stockStatus = status;
      this.saveToLocalStorage();

      if (this.supabaseClient) {
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

    if (this.supabaseClient) {
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

    if (this.supabaseClient) {
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
  }

  public deleteAddonGroup(groupId: string) {
    this.memoryData.addonGroups = this.memoryData.addonGroups.filter((g) => g.id !== groupId);
    this.saveToLocalStorage();
  }

  // Gallery, Testimonials, Offers, FAQs
  public saveGalleryItem(item: GalleryItem) {
    const idx = this.memoryData.gallery.findIndex((g) => g.id === item.id);
    if (idx >= 0) {
      this.memoryData.gallery[idx] = item;
    } else {
      this.memoryData.gallery.push(item);
    }
    this.saveToLocalStorage();
  }

  public deleteGalleryItem(id: string) {
    this.memoryData.gallery = this.memoryData.gallery.filter((g) => g.id !== id);
    this.saveToLocalStorage();
  }

  public saveTestimonial(t: Testimonial) {
    const idx = this.memoryData.testimonials.findIndex((item) => item.id === t.id);
    if (idx >= 0) {
      this.memoryData.testimonials[idx] = t;
    } else {
      this.memoryData.testimonials.push(t);
    }
    this.saveToLocalStorage();
  }

  public deleteTestimonial(id: string) {
    this.memoryData.testimonials = this.memoryData.testimonials.filter((t) => t.id !== id);
    this.saveToLocalStorage();
  }

  public saveOffer(offer: SpecialOffer) {
    const idx = this.memoryData.offers.findIndex((o) => o.id === offer.id);
    if (idx >= 0) {
      this.memoryData.offers[idx] = offer;
    } else {
      this.memoryData.offers.push(offer);
    }
    this.saveToLocalStorage();
  }

  public deleteOffer(id: string) {
    this.memoryData.offers = this.memoryData.offers.filter((o) => o.id !== id);
    this.saveToLocalStorage();
  }

  public saveFAQ(faq: FAQItem) {
    const idx = this.memoryData.faqs.findIndex((f) => f.id === faq.id);
    if (idx >= 0) {
      this.memoryData.faqs[idx] = faq;
    } else {
      this.memoryData.faqs.push(faq);
    }
    this.saveToLocalStorage();
  }

  public deleteFAQ(id: string) {
    this.memoryData.faqs = this.memoryData.faqs.filter((f) => f.id !== id);
    this.saveToLocalStorage();
  }

  // Party Inquiries
  public async submitPartyInquiry(inquiry: Omit<PartyInquiry, 'id' | 'createdAt'>): Promise<boolean> {
    const newInquiry: PartyInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // If Supabase is connected, record it directly in DB
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('party_inquiries').insert({
          guest_count: newInquiry.guestCount,
          event_date: newInquiry.eventDate,
          event_type: newInquiry.eventType,
          name: newInquiry.name,
          phone: newInquiry.phone,
          requirements: newInquiry.requirements,
        });
      } catch (e) {
        console.warn('Failed to insert party inquiry to Supabase:', e);
      }
    }

    return true;
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
        return { success: false, error: 'Invalid configuration format: Missing required profile, categories, or items.' };
      }
      this.memoryData = {
        ...DEFAULT_RESTAURANT_DATA,
        ...parsed,
        version: SCHEMA_VERSION,
      };
      this.saveToLocalStorage();
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON file';
      return { success: false, error: msg };
    }
  }

  public resetToDemoDefaults() {
    this.memoryData = JSON.parse(JSON.stringify(DEFAULT_RESTAURANT_DATA));
    this.saveToLocalStorage();
  }
}

// Singleton export
export const dataProvider = new DataProviderService();
