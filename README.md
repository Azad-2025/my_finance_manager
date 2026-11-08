# My Finance Manager (আমার ফাইন্যান্স ম্যানেজার)

A complete, production-ready, modern Personal Finance & Expense Management Web Application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **IndexedDB Offline Engine**, and **Supabase (PostgreSQL Database & Authentication with Row Level Security)**.

- **Primary Currency**: Bangladeshi Taka (BDT / ৳)
- **Default Timezone**: Asia/Dhaka (GMT+6)
- **Bilingual Interface**: English (EN) & Bangla (বাংলা)
- **Progressive Web App (PWA)**: Complete offline support, IndexedDB sync queue, Growth Mark branding, and safe update mechanism.

---

## 🌟 Key Upgrades & Highlights

### 1. Growth Mark Brand Identity
- **Transparent SVG Brand Logo**: Growth Mark icon with ascending arrow crest and 3 pillars in rich emerald gradient (`#059669` to `#10B981`) on deep navy (`#0F172A`).
- **Complete PWA App Icon System**:
  - `icon-192x192.png` & `icon-512x512.png` (standard Chromium/Android icons)
  - `maskable-192x192.png` & `maskable-512x512.png` (safe-zone padded icons for Android squircles)
  - `apple-touch-icon.png` (180x180 PNG for iOS Safari home screens)
  - `favicon.ico` & `favicon.svg` (crisp browser tab icons)
- **Responsive Mobile Visibility**: Logo icon and typography remain balanced and legible across desktop, tablet, and mobile displays without clipping.

### 2. Professional App Startup Experience
- Branded launch screen with centered Growth Mark icon and smooth emerald glow animation.
- Session-guarded (`sessionStorage`) so internal route navigation never unnecessarily replays the startup animation.
- Fully respects `prefers-reduced-motion` settings.

### 3. Durable Offline Functionality with IndexedDB
- **Structured Offline Storage**: Uses native browser `IndexedDB` (`MyFinanceManagerDB`) for all transactions, borrowings, and lendings.
- **Client-Generated UUIDs**: Prevents ID collisions when records are created offline (`tx-${timestamp}-${random}`).
- **Idempotency Keys**: Each record contains a unique idempotency key to prevent accidental duplicate insertions.
- **Offline Sync Queue**: Maintains an automated background queue tracking record states: `pending`, `syncing`, `synced`, or `failed`.
- **Automatic Reconnection Sync**: Detects network connectivity changes, drains the queue safely and sequentially into Supabase, and updates local states.
- **Multi-State Connection UI**:
  - 🟢 **Online**: Live Supabase synchronization active.
  - 🟡 **Offline**: Transactions saved locally in IndexedDB; shows pending record counter.
  - 🔄 **Syncing**: Background synchronization in progress.
  - ⬆️ **Pending Sync**: Manual "Sync" trigger for queued offline records.
  - 🔴 **Sync Failed**: Clear alert with "Retry" action.

### 4. Data-Safe PWA Update Mechanism
- **Permanent Application Identity**: Fixed `id: '/'`, `start_url: '/'`, and `scope: '/'` in Web App Manifest ensures browsers never treat updates as a new app.
- **Non-Intrusive Prompt**: Detects new service worker versions and displays an "Update Available" banner with **"Update Now"** and **"Later"** options.
- **Zero Data Loss**: Updating the application preserves IndexedDB and localStorage records. Offline queues and user settings remain 100% intact.

---

## 📱 How to Install the PWA on Your Phone

### On Android (Chrome / Edge / Samsung Internet):
1. Open the application in Google Chrome on your phone.
2. Tap the **Install** button in the top navbar or the **Install App on Phone** card in the **More** drawer.
3. If prompted by Chrome, tap **Install** to add **My Finance Manager** directly to your home screen.
4. Launch the app from your home screen for full-screen native experience without browser address bars!

### On iPhone & iPad (iOS Safari):
1. Open the application in Safari on your iOS device.
2. Tap the **Share** button (📤 icon in the bottom Safari toolbar).
3. Scroll down and tap **Add to Home Screen (➕)**.
4. Tap **Add** in the top right corner.
5. The Growth Mark app icon will appear on your home screen.

---

## ⚡ Deployment to Vercel

The project is fully pre-configured for seamless Vercel deployment:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: upgrade PWA, offline IndexedDB sync, and Growth Mark branding"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
   - Select your GitHub repository.
   - Vercel automatically detects Vite with:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Under **Environment Variables**, add:
     - `VITE_SUPABASE_URL`: Your Supabase Project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Public Anon Key
   - Click **Deploy**.

3. **SPA Routing & Caching**:
   `vercel.json` contains single-page app rewrite rules (`/(.*) -> /index.html`) so refreshing routes never returns 404, along with optimized Cache-Control headers for the service worker (`sw.js`) and manifest.

---

## 🗄️ Supabase PostgreSQL Setup (Optional Cloud Sync)

The application functions completely offline or in local mode without Supabase. To enable multi-device cloud synchronization:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** -> **New query**.
3. Copy the migration SQL from `supabase/schema.sql` and click **Run**.
4. Copy your project URL and public anon key from **Project Settings** -> **API**.
5. In **My Finance Manager**, navigate to **Settings** -> **Supabase Configuration** and paste your credentials, or define them in `.env`.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server (port 3000)
npm run dev

# 3. Build for production & verify PWA bundle
npm run build
```

---

## 📄 License
Apache-2.0
