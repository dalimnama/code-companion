

# Luriva BD — Bangladeshi eCommerce Store (Phase 1)

## Overview
A modern, mobile-first Bangladeshi online shop built with React + Vite + Tailwind CSS + Supabase. Bilingual (Bangla/English), BDT currency, clean premium design. This phase covers the core shopping experience — browsing, product details, cart, and checkout.

---

## 🗄️ Database (Supabase)

Set up the following tables with seed data:
- **categories** (6 categories with Bangla/English names, slugs, images)
- **brands** (4 brands)
- **products** (30 products with images, prices, discounts, ratings, stock)
- **banners** (3 hero banners)
- **coupons** (3 demo coupons)

Seed realistic Bangladeshi product data (fashion, electronics, beauty, home, etc.) with BDT pricing.

---

## 🎨 Design System

- **Theme**: Minimal, premium ecommerce — white space, rounded cards, soft shadows
- **Colors**: Clean white/neutral palette with a brand accent color
- **Typography**: Clear hierarchy, bilingual-friendly fonts
- **Dark/light mode** toggle
- **Animations**: Subtle hover effects, fade-ins, smooth transitions
- **Fully responsive**: Mobile-first with desktop enhancements

---

## 📄 Pages & Features

### 1. Home Page (`/`)
- **Announcement bar** (e.g., "ঢাকায় ৳১৯৯৯+ অর্ডারে ফ্রি ডেলিভারি")
- **Sticky header**: Logo, search bar, language toggle (BN/EN), cart icon with item count
- **Hero banner slider** (3 slides with CTA buttons)
- **Featured categories** grid
- **Product sections**: Best Sellers, New Arrivals, Flash Sale with countdown timer
- **Product cards**: Image, title, price, discount badge, rating stars, quick "Add to Cart"
- **Trust badges**: Authentic products, Easy returns, Fast delivery, Secure payment
- **Footer**: About, Help, Policies, Contact, social icons

### 2. Category Listing (`/c/:slug`)
- Category banner and description
- **Filters sidebar**: Price range, brand, rating, availability
- **Sort**: Popularity, newest, price low→high / high→low
- **Pagination** with URL query sync
- Responsive grid of product cards

### 3. Search (`/search?q=`)
- Debounced search input with suggestion dropdown
- Results page with filters and sorting

### 4. Product Details (`/p/:slug`)
- **Image gallery** with thumbnails and zoom-on-hover
- Title, short description, rating with review count
- Price display with discount calculation and "save" badge
- Stock status indicator
- **Quantity selector**, "Add to Cart", "Buy Now", Wishlist button
- Delivery estimate (Inside Dhaka / Outside Dhaka)
- **Tabs**: Description, Specifications
- Related products carousel

### 5. Cart (`/cart`)
- Editable quantities, remove items
- Coupon code input with apply/remove and validation
- **Order summary**: Subtotal, shipping estimate, discount, total in BDT
- "Proceed to Checkout" CTA
- Empty cart state with "Continue Shopping" link

### 6. Checkout (`/checkout`)
- **Step form**: (1) Customer Info (2) Shipping Address (3) Payment (4) Review & Confirm
- Shipping options: Inside Dhaka (৳60), Outside Dhaka (৳120), Express (৳200)
- **Payment methods** (demo): Cash on Delivery, bKash (transaction ID input), Nagad
- Form validation with inline errors (React Hook Form + Zod)
- Order success page (`/order-success`) with order summary

---

## 🛒 Cart & Wishlist

- **Cart state** managed with Zustand, persisted to localStorage
- Wishlist saved to localStorage
- Toast notifications for cart add/remove actions
- BDT (৳) formatting throughout

---

## 🌐 Bilingual Support

- Language toggle (বাংলা / English) in header
- Key UI labels, buttons, and microcopy in both languages
- Product content in English (seed data), UI chrome bilingual

---

## ⚡ Performance & UX

- Skeleton loaders for product grids and product detail page
- Lazy-loaded images
- Debounced search
- Smooth page transitions
- 404 page and empty states
- Floating WhatsApp chat button (bottom-right)

---

## 📋 Static Pages

- `/about` — About Luriva BD
- `/contact` — WhatsApp, phone, email placeholders
- `/privacy-policy`, `/terms`, `/return-policy`, `/shipping-policy`

---

## 🔮 Phase 2 (Future)

These features will be added after the core shopping experience is solid:
- User authentication (sign in/sign up)
- User accounts (profile, order history, saved addresses, wishlist sync)
- Order tracking with status timeline
- Product reviews & Q&A
- Admin dashboard (product/order/coupon CRUD, analytics)
- Newsletter signup
- Facebook Pixel / analytics integration

