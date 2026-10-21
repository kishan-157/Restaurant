/**
 * Generates versioned, production-ready PostgreSQL SQL script for Supabase setup.
 * Each restaurant client runs this script in their own Supabase SQL Editor.
 */

export const SCHEMA_VERSION = 'v1.2.0';

export function generateRestaurantDatabaseSQL(restaurantName: string = 'Saffron & Spice Kitchen'): string {
  return `-- ==============================================================================
-- RESTAURANT MASTER TEMPLATE - SUPABASE DATABASE SETUP SCRIPT
-- Schema Version: ${SCHEMA_VERSION}
-- Target Restaurant: ${restaurantName}
-- Generated: ${new Date().toISOString()}
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project -> SQL Editor -> New Query.
-- 3. Paste this entire script and click "Run" (Cmd+Enter or Ctrl+Enter).
-- 4. In Supabase Authentication -> Users, create your Restaurant Owner user.
-- 5. Return to the Restaurant Admin Panel and enter your Project URL and Anon Key.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANT PROFILE & BRANDING
CREATE TABLE IF NOT EXISTS public.restaurant_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    story TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    hero_image_url TEXT,
    cuisine_type TEXT DEFAULT 'Authentic Indian Cuisine',
    price_range TEXT DEFAULT '₹₹ (Moderate)',
    phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Mumbai',
    postal_code TEXT,
    google_maps_url TEXT,
    currency_symbol TEXT DEFAULT '₹',
    currency_code TEXT DEFAULT 'INR',
    theme_preset TEXT DEFAULT 'royal-saffron',
    primary_color TEXT DEFAULT '#C2410C',
    secondary_color TEXT DEFAULT '#78350F',
    accent_color TEXT DEFAULT '#F59E0B',
    font_heading TEXT DEFAULT 'Playfair Display',
    font_body TEXT DEFAULT 'Plus Jakarta Sans',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OPENING HOURS & SCHEDULE
CREATE TABLE IF NOT EXISTS public.opening_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekly_closing_day TEXT DEFAULT 'None',
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    holiday_notice TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WEBSITE SECTION TOGGLES
CREATE TABLE IF NOT EXISTS public.website_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_hero BOOLEAN DEFAULT TRUE,
    show_order_modes BOOLEAN DEFAULT TRUE,
    show_special_offers BOOLEAN DEFAULT TRUE,
    show_featured_menu BOOLEAN DEFAULT TRUE,
    show_full_menu BOOLEAN DEFAULT TRUE,
    show_about BOOLEAN DEFAULT TRUE,
    show_gallery BOOLEAN DEFAULT TRUE,
    show_testimonials BOOLEAN DEFAULT TRUE,
    show_google_reviews BOOLEAN DEFAULT TRUE,
    show_location_hours BOOLEAN DEFAULT TRUE,
    show_catering_inquiry BOOLEAN DEFAULT TRUE,
    show_faq BOOLEAN DEFAULT TRUE,
    show_footer BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDER & DELIVERY SETTINGS
CREATE TABLE IF NOT EXISTS public.order_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accept_home_delivery BOOLEAN DEFAULT TRUE,
    accept_takeaway BOOLEAN DEFAULT TRUE,
    accept_pickup BOOLEAN DEFAULT TRUE,
    enable_whatsapp_ordering BOOLEAN DEFAULT TRUE,
    enable_online_platform_links BOOLEAN DEFAULT TRUE,
    enable_cart_and_checkout BOOLEAN DEFAULT TRUE,
    temporarily_pause_orders BOOLEAN DEFAULT FALSE,
    pause_message TEXT DEFAULT 'We are currently preparing fresh batches! Kitchen re-opens shortly.',
    delivery_fee NUMERIC(10, 2) DEFAULT 40.00,
    min_order_amount NUMERIC(10, 2) DEFAULT 250.00,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 600.00,
    estimated_delivery_time TEXT DEFAULT '35-45 mins',
    estimated_pickup_time TEXT DEFAULT '20-25 mins',
    service_area_notes TEXT DEFAULT 'Delivering within 6 km radius.',
    pickup_instructions TEXT DEFAULT 'Collect from main counter. Show your WhatsApp order confirmation.',
    swiggy_url TEXT DEFAULT '',
    zomato_url TEXT DEFAULT '',
    other_platform_name TEXT DEFAULT '',
    other_platform_url TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    icon_name TEXT DEFAULT 'Utensils',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    is_veg BOOLEAN DEFAULT TRUE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    spice_level INT DEFAULT 1 CHECK (spice_level BETWEEN 0 AND 3),
    stock_status TEXT DEFAULT 'available' CHECK (stock_status IN ('available', 'out_of_stock', 'temporarily_unavailable', 'hidden')),
    image_url TEXT,
    display_order INT DEFAULT 0,
    has_variants BOOLEAN DEFAULT FALSE,
    has_addons BOOLEAN DEFAULT FALSE,
    portion_info TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ITEM VARIANTS (e.g., Half / Full, 2 pcs / 4 pcs)
CREATE TABLE IF NOT EXISTS public.item_variants (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

-- 8. ADDON GROUPS (e.g., Extra Gravy, Butter Topping)
CREATE TABLE IF NOT EXISTS public.addon_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    min_select INT DEFAULT 0,
    max_select INT DEFAULT 1,
    options JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 9. GALLERY RECORDS
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'food',
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0
);

-- 10. TESTIMONIALS & REVIEWS
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    rating INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    source TEXT DEFAULT 'Google',
    date TEXT DEFAULT 'Recent',
    dish_recommended TEXT
);

-- 11. SPECIAL OFFERS
CREATE TABLE IF NOT EXISTS public.special_offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    discount_badge TEXT NOT NULL,
    valid_until TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 12. FREQUENTLY ASKED QUESTIONS
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General'
);

-- 13. PARTY & CATERING INQUIRIES (Submitted by diners)
CREATE TABLE IF NOT EXISTS public.party_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_count INT NOT NULL,
    event_date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SCHEMA VERSION TRACKING
CREATE TABLE IF NOT EXISTS public.schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.schema_version (version) 
VALUES ('${SCHEMA_VERSION}') 
ON CONFLICT (version) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.restaurant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_version ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ POLICIES (Anonymous website visitors can view published content)
CREATE POLICY "Public read restaurant profile" ON public.restaurant_profile FOR SELECT USING (true);
CREATE POLICY "Public read opening hours" ON public.opening_hours FOR SELECT USING (true);
CREATE POLICY "Public read website sections" ON public.website_sections FOR SELECT USING (true);
CREATE POLICY "Public read order settings" ON public.order_settings FOR SELECT USING (true);
CREATE POLICY "Public read active categories" ON public.menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read visible menu items" ON public.menu_items FOR SELECT USING (stock_status != 'hidden');
CREATE POLICY "Public read variants" ON public.item_variants FOR SELECT USING (true);
CREATE POLICY "Public read addon groups" ON public.addon_groups FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Public read special offers" ON public.special_offers FOR SELECT USING (is_active = true);
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Public read schema version" ON public.schema_version FOR SELECT USING (true);

-- Diners can insert party inquiries
CREATE POLICY "Public insert party inquiries" ON public.party_inquiries FOR INSERT WITH CHECK (true);

-- 2. OWNER/ADMIN POLICIES (Authenticated Supabase users have full management rights)
CREATE POLICY "Admin all restaurant profile" ON public.restaurant_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all opening hours" ON public.opening_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all website sections" ON public.website_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all order settings" ON public.order_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all menu categories" ON public.menu_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all menu items" ON public.menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all variants" ON public.item_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all addon groups" ON public.addon_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all gallery" ON public.gallery_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all testimonials" ON public.testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all special offers" ON public.special_offers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all faqs" ON public.faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin read party inquiries" ON public.party_inquiries FOR SELECT TO authenticated USING (true);

-- Create indexes for menu query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON public.menu_items(stock_status);
CREATE INDEX IF NOT EXISTS idx_variants_menu_item ON public.item_variants(menu_item_id);

-- End of setup script
`;
}
