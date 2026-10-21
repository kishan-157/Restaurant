# Saffron & Spice — Reusable Master Restaurant Website & Admin Template

A complete, production-minded Master Restaurant Website Template with an integrated Admin Panel, digital menu, WhatsApp Click-to-Chat ordering, inventory availability toggles, customizable branding presets, and optional owner-managed Supabase PostgreSQL connectivity.

Developed once, reusable for multiple restaurant clients. Each restaurant client can be provisioned with its own GitHub repository, independent Supabase project, custom color palette, and WhatsApp number without rewriting code.

---

## 🌟 Key Architecture & Features

### 1. Public Digital Storefront & Menu
- **Mobile-First Responsive Layout**: Optimized for smartphone diners (90%+ of restaurant traffic).
- **Interactive Digital Menu**: Real-time search, category filters (Starters, Curries, Biryani, Breads, Desserts, Refreshers), and dietary filters (Pure Veg green dot, Non-Veg red triangle, Bestsellers, Spice levels).
- **Dish Customization Modal**: Portions (e.g. Half / Full, 2pc / 4pc), custom add-on groups (Extra Butter, Extra Cheese, Chutneys), and chef cooking notes.
- **WhatsApp Click-to-Chat Ordering**: Generates formatted, emoji-adorned WhatsApp messages with itemized dishes, portions, delivery fees, customer name, address, and special notes. Requires **no paid WhatsApp Business API**.
- **Delivery & Pickup Settings**: Free delivery threshold progress bar, delivery fees, minimum order amounts, and takeaway timings.
- **Third-Party Platforms**: Clean external links to verified Swiggy, Zomato, and custom ordering pages.
- **Sections**: Hero Showcase, Fulfillment Strip, Special Offers & Coupon Codes, Culinary Heritage & Dum technique, Visual Photo Gallery, Verified Diner Reviews, Opening Hours & Google Maps Directions, Party & Catering Inquiry Modal, Privacy Policy & Terms.

### 2. Complete Restaurant Owner Admin Panel (16 Modules)
1. **Dashboard**: Genuine inventory metrics (categories count, active dishes, sold-out items, delivery options, incomplete setup checklist). *Zero fake vanity revenue numbers.*
2. **Website Branding**: 4 curated themes (Royal Saffron, Emerald Mint, Midnight Charcoal, Heritage Copper), custom hex color inputs, heading fonts, hero title, and live component swatch preview.
3. **Website Sections**: 12 independent toggles to turn sections on or off.
4. **Menu Categories**: Add, edit, reorder, delete, and toggle categories.
5. **Menu Items**: Full dish management, pricing, portions, spice levels, veg/non-veg status, and 1-click dish duplication.
6. **Variants & Add-ons**: Manage item variants (Half/Full) and add-on groups with min/max selection constraints.
7. **Stock & Availability**: Rapid 1-tap toggles for busy kitchen shifts (`Available`, `Sold Out`, `Temporarily Unavailable`, `Hidden`).
8. **Order Settings**: Delivery fees, min order threshold, free shipping threshold, and an **Emergency Kitchen Pause Switch** with custom customer message.
9. **Restaurant Information**: Contact phone, WhatsApp order destination number, street address, and 7-day schedule with lunch/dinner breaks.
10. **Gallery & Images**: Food, ambience, and chef photo management.
11. **Social Media & External Platforms**: Swiggy URL, Zomato URL, Instagram, Facebook, Google Maps link.
12. **SEO Settings**: Meta title, description, keywords, and live Google search snippet simulation.
13. **Database Setup (Supabase Wizard)**: Versioned SQL generator, 1-click copy/download, connection tester, and automated table verification.
14. **Preview Website**: Immediate live preview mode.
15. **Backup & Export**: Export entire restaurant configuration bundle as JSON, import with schema validation, and factory reset to demo data.
16. **Help & Setup Guide**: Developer playbook for spinning up new restaurant clients.

### 3. Dual Data Modes
- **Mode A (Demo / Local Storage)**: Runs immediately out of the box with zero external dependencies. Changes persist in local browser storage.
- **Mode B (Connected Supabase)**: Connects to the restaurant's personal Supabase PostgreSQL database with Row Level Security (RLS) policies.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd <your-repo-folder>

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📦 How to Re-use This Template for a New Restaurant Client

Follow this 4-step workflow to deliver a custom website to a client in 15 minutes:

### Step 1: Create a New GitHub Repository
1. Fork or copy this repository into a new GitHub repo (e.g., `github.com/your-agency/client-maharaja-bistro`).
2. Clone locally or open in your cloud IDE.

### Step 2: Configure Client Branding & Menu
1. Open the website and click **Owner Admin** in the top navigation.
2. In **Website Branding**, pick a theme preset (e.g. *Royal Saffron* or *Emerald Mint*) or enter the client's brand hex colors.
3. In **Restaurant Info**, set the client's official **WhatsApp Number** in international format without `+` or spaces (e.g., `919820012345` for an Indian mobile).
4. Update **Menu Categories** and **Menu Items** with their real menu dishes and prices.
5. In **Order Settings**, set their minimum delivery amount, delivery fee, and free delivery threshold.

### Step 3: (Optional) Connect the Client's Supabase Database
1. Go to [supabase.com](https://supabase.com) and create a free project for the restaurant.
2. In the Admin Panel, navigate to **Tab 13: Database Setup**.
3. Click **Copy SQL** and paste it into the Supabase **SQL Editor**, then click **Run**.
4. In Supabase **Project Settings → API**, copy the **Project URL** and **anon public key**.
5. Paste them into the Database Setup tab and click **Verify Schema & Connect**.

### Step 4: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select the client's GitHub repository.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Click **Deploy**. The site is live with a global CDN and automatic HTTPS!

---

## 🔒 Security & Row Level Security (RLS)

- **Browser Safety**: The application only uses the Supabase `anon public` key. The `service-role` secret key is never used or requested.
- **Row Level Security**:
  - Website visitors have `SELECT` permissions strictly for published menu items and active categories.
  - Restaurant owners with authenticated logins have full `INSERT`, `UPDATE`, and `DELETE` permissions.
  - Customer party inquiries are allowed to `INSERT` into the inquiries table.

---

## 📱 WhatsApp Order Message Example

When a customer checks out on the website, clicking **Order on WhatsApp** pre-fills:

```
🍽️ *NEW ORDER - SAFFRON & SPICE*
━━━━━━━━━━━━━━━━━━━━━
📋 *Order Type:* 🛵 HOME DELIVERY
👤 *Customer Name:* Rohit Sharma
📞 *Customer Phone:* 98200 12345
📍 *Delivery Address:* Flat 402, Sea Green Apartments, Linking Road
📌 *Landmark:* Near HDFC Bank
━━━━━━━━━━━━━━━━━━━━━
🛒 *ITEMIZED ORDER:*
1. 🟢 *Paneer Tikka Angara* (Full (8 pcs)) x 1
    Price: ₹340.00
    Add-ons: + Extra Mint Chutney (₹25.00)
    Note: "Make it spicy"
2. 🔴 *Awadhi Dum Chicken Biryani* (Regular Pot) x 1
    Price: ₹420.00
3. 🟢 *Butter Garlic Naan* x 2
    Price: ₹180.00
━━━━━━━━━━━━━━━━━━━━━
💵 *BILL SUMMARY:*
• Subtotal: ₹965.00
• Delivery Fee: FREE (Order above ₹599.00)
⭐ *TOTAL ESTIMATED AMOUNT: ₹965.00*
━━━━━━━━━━━━━━━━━━━━━
📝 *Special Instructions / Preferences:*
"Please send extra pickled sirka onions"
━━━━━━━━━━━━━━━━━━━━━
_Sent via Saffron & Spice Digital Menu. Please confirm availability & estimated prep time._
```

---

## 📄 License
MIT License. Free to customize, white-label, and deploy for commercial restaurant clients.
