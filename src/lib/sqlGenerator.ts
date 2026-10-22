/**
 * Generates versioned, production-ready PostgreSQL SQL script for Supabase setup.
 * Supports full real-time sync for Sarab Fast Food & Dining Website + Admin Dashboard.
 */

export const SCHEMA_VERSION = 'v2.0.0';

export function generateRestaurantDatabaseSQL(restaurantName: string = 'Sarab Fast Food & Dining'): string {
  return `-- ==============================================================================
-- SARAB RESTAURANT & ADMIN DASHBOARD - SUPABASE REALTIME DATABASE SETUP SCRIPT
-- Schema Version: ${SCHEMA_VERSION}
-- Target Restaurant: ${restaurantName}
-- Generated: ${new Date().toISOString()}
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project -> SQL Editor -> New Query.
-- 3. Paste this entire script and click "Run" (Cmd+Enter or Ctrl+Enter).
-- 4. Return to the Sarab Admin Dashboard -> Supabase Cloud Sync and click "Connect".
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANT PROFILE, THEME & FULL SITE CUSTOMIZATION BUNDLE
CREATE TABLE IF NOT EXISTS public.restaurant_profile (
    id TEXT PRIMARY KEY DEFAULT 'main',
    name TEXT NOT NULL DEFAULT 'Sarab',
    tagline TEXT DEFAULT 'Fast Food & Dining',
    description TEXT,
    story TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    hero_image_url TEXT,
    cuisine_type TEXT DEFAULT '#1 Rated Fast Food Restaurant in New York',
    price_range TEXT DEFAULT '$10 - $25 per person',
    phone TEXT NOT NULL DEFAULT '+1 (800) 123-4567',
    whatsapp_number TEXT NOT NULL DEFAULT '18001234567',
    email TEXT DEFAULT 'hello@sarabfood.com',
    address TEXT NOT NULL DEFAULT '42 Flavor Street, Food District',
    city TEXT DEFAULT 'New York, NY',
    postal_code TEXT DEFAULT '10001',
    google_maps_url TEXT,
    currency_symbol TEXT DEFAULT '$',
    currency_code TEXT DEFAULT 'USD',
    theme_preset TEXT DEFAULT 'sarab-crimson',
    primary_color TEXT DEFAULT '#e8281a',
    secondary_color TEXT DEFAULT '#f6a623',
    accent_color TEXT DEFAULT '#2d6a4f',
    font_heading TEXT DEFAULT 'Playfair Display',
    font_body TEXT DEFAULT 'Poppins',
    site_bundle JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.restaurant_profile ADD COLUMN IF NOT EXISTS site_bundle JSONB DEFAULT '{}'::jsonb;

-- 2. OPENING HOURS & SCHEDULE
CREATE TABLE IF NOT EXISTS public.opening_hours (
    id TEXT PRIMARY KEY DEFAULT 'main',
    weekly_closing_day TEXT DEFAULT 'Monday - Tuesday',
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    holiday_notice TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WEBSITE SECTION TOGGLES
CREATE TABLE IF NOT EXISTS public.website_sections (
    id TEXT PRIMARY KEY DEFAULT 'main',
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
    id TEXT PRIMARY KEY DEFAULT 'main',
    accept_home_delivery BOOLEAN DEFAULT TRUE,
    accept_takeaway BOOLEAN DEFAULT TRUE,
    accept_pickup BOOLEAN DEFAULT TRUE,
    enable_whatsapp_ordering BOOLEAN DEFAULT TRUE,
    enable_admin_panel_ordering BOOLEAN DEFAULT TRUE,
    enable_online_platform_links BOOLEAN DEFAULT TRUE,
    enable_cart_and_checkout BOOLEAN DEFAULT TRUE,
    temporarily_pause_orders BOOLEAN DEFAULT FALSE,
    pause_message TEXT DEFAULT 'Our kitchen is prepping fresh batches. Ordering resumes shortly!',
    delivery_fee NUMERIC(10, 2) DEFAULT 2.99,
    min_order_amount NUMERIC(10, 2) DEFAULT 10.00,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 25.00,
    estimated_delivery_time TEXT DEFAULT '20-25 mins',
    estimated_pickup_time TEXT DEFAULT '10-15 mins',
    service_area_notes TEXT DEFAULT '42 Flavor Street, Food District, New York — Express 20 min delivery.',
    pickup_instructions TEXT DEFAULT 'Pick up directly at our Express Counter at 42 Flavor Street, NY.',
    swiggy_url TEXT DEFAULT '',
    zomato_url TEXT DEFAULT '',
    other_platform_name TEXT DEFAULT '',
    other_platform_url TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_settings ADD COLUMN IF NOT EXISTS enable_admin_panel_ordering BOOLEAN DEFAULT TRUE;

-- 5. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    icon_name TEXT DEFAULT 'Utensils',
    image_url TEXT DEFAULT '',
    item_count_label TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS item_count_label TEXT DEFAULT '';

-- 6. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    old_price NUMERIC(10, 2),
    is_veg BOOLEAN DEFAULT TRUE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    spice_level INT DEFAULT 1 CHECK (spice_level BETWEEN 0 AND 3),
    stock_status TEXT DEFAULT 'available' CHECK (stock_status IN ('available', 'out_of_stock', 'temporarily_unavailable', 'hidden')),
    image_url TEXT,
    display_order INT DEFAULT 0,
    has_variants BOOLEAN DEFAULT FALSE,
    has_addons BOOLEAN DEFAULT FALSE,
    portion_info TEXT,
    calories TEXT,
    prep_time TEXT,
    rating NUMERIC(3, 1) DEFAULT 4.9,
    reviews_count INT DEFAULT 100,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS old_price NUMERIC(10, 2);
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS calories TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS prep_time TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 4.9;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 100;

-- 7. ITEM VARIANTS
CREATE TABLE IF NOT EXISTS public.item_variants (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

-- 8. ADDON GROUPS
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
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'food',
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0
);

ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 10. TESTIMONIALS & REVIEWS
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    rating INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    source TEXT DEFAULT 'Regular Customer',
    date TEXT DEFAULT 'Recent',
    dish_recommended TEXT,
    avatar_url TEXT DEFAULT ''
);

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

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

-- 13. PARTY & CATERING INQUIRIES
CREATE TABLE IF NOT EXISTS public.party_inquiries (
    id TEXT PRIMARY KEY,
    guest_count INT NOT NULL,
    event_date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ORDERS & KITCHEN TICKETS (WhatsApp & Admin Direct Channels)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_type TEXT DEFAULT 'delivery',
    delivery_address TEXT,
    delivery_landmark TEXT,
    special_instructions TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    channel TEXT NOT NULL DEFAULT 'admin',
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_landmark TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 15. TABLE RESERVATIONS (#reservation)
CREATE TABLE IF NOT EXISTS public.table_reservations (
    id TEXT PRIMARY KEY,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT NOT NULL,
    party_size TEXT NOT NULL DEFAULT '2 People',
    reservation_date TEXT NOT NULL,
    reservation_time TEXT NOT NULL,
    special_request TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CONTACT MESSAGES (#contact-section)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. SCHEMA VERSION TRACKING
CREATE TABLE IF NOT EXISTS public.schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.schema_version (version) 
VALUES ('${SCHEMA_VERSION}') 
ON CONFLICT (version) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (PUBLIC + ADMIN SYNC)
-- ==============================================================================

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
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_version ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely so script is 100% idempotent
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'restaurant_profile', 'opening_hours', 'website_sections', 'order_settings',
        'menu_categories', 'menu_items', 'item_variants', 'addon_groups',
        'gallery_items', 'testimonials', 'special_offers', 'faqs',
        'party_inquiries', 'orders', 'table_reservations', 'contact_messages', 'schema_version'
    ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Sarab full sync %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Sarab full sync %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- Create indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON public.menu_items(stock_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.table_reservations(created_at DESC);

-- Enable Supabase Realtime on key tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.table_reservations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_profile;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- End of setup script
`;
}
