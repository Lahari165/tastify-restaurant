# Tastify — Arabian Mandi & Restaurant (టేస్టిఫై)
### Full-Stack Express & Vanilla Frontend Web Application

---

## 🚀 How to Run in Terminal

To run the complete full-stack website with all backend APIs and frontend features:

### Step 1: Open Terminal in Project Directory
```powershell
cd C:\Users\LAHARI\Desktop\Tastify
```

### Step 2: Start the Full-Stack Server
```powershell
npm start
```
*(or `node server.js`)*

### Step 3: Open in Browser
Visit:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚡ Backend Endpoints & Architecture

The Express backend (`server.js`) serves both the frontend static site and the REST APIs:

- **Frontend Website**: `http://localhost:3000`
- **Menu API**: `GET http://localhost:3000/api/menu`
- **Reviews API**: `GET / POST http://localhost:3000/api/reviews`
- **Orders API**: `GET / POST http://localhost:3000/api/orders`
- **Reservations API**: `GET / POST http://localhost:3000/api/reservations`
- **Server Health**: `GET http://localhost:3000/api/health`

Data is persisted in the [`data/`](file:///c:/Users/LAHARI/Desktop/Tastify/data) directory (`menu.json`, `reviews.json`, `orders.json`, `reservations.json`).

---

## ✨ Features Implemented & Verified

1. **Multi-Theme Switcher**:
   - 🌙 **Arabian Night** (Dark Obsidian Luxury - Default)
   - ☀️ **Desert Palace** (Royal Warm Ivory / Light Luxury)
   - 🌿 **Emerald Oasis** (Jewel Green Royalty)
   - Switchable via:
     - Header Theme Button in the navigation bar
     - Floating quick-action theme button at the bottom-left
     - Direct visual cards inside the **Share with Friends Modal**
   - Automatically persisted in `localStorage`.

2. **Share to Friends Modal & Direct Redirection**:
   - Click **"Share with Friends"** from anywhere (Hero, Navigation, Mobile Drawer, Location section, Footer, or the floating quick action button).
   - **WhatsApp (Direct)**: Redirects immediately to `https://api.whatsapp.com/send?text=...` (desktop) and `https://wa.me/?text=...` (mobile) with pre-filled slow-cooked mandi details, price (₹200–₹400/person), address (Maisammaguda, Hyderabad), phone (099668 88060), and map link!
   - **Instagram**: Safely copies rich invitation text and link to clipboard, provides visual toast, and redirects to Instagram app/web.
   - **Native App Share Sheet**: For smartphones (Android/iOS) to share via WhatsApp Status, IG Stories, Snapchat, etc.
   - **Twitter / X & Telegram**: Direct post creation links.
   - **Copy Direct Link**: Dedicated input with a **Copy Link** button that shifts to **"Copied! ✓"** in green with toast confirmation.
   - **Integrated Atmosphere Switcher**: 3 visual theme cards at the bottom of the modal so you can change the theme with a single click.

3. **Floating Quick Actions Bar (Bottom Left)**:
   - 🌙/☀️ **Theme Toggle**: Cycles theme on click.
   - 🔗 **Share Button**: Instantly opens the Share with Friends modal.
   - 💬 **WhatsApp Chat**: Direct one-click chat with Tastify (099668 88060).

4. **Interactive Food Cart & Order Flow**:
   - Click **"+ Add to Order"** on any dish (*Chicken Mandi*, *Chicken 65 Mandi*, etc.).
   - Floating Cart Bar automatically pops up showing selected dishes and subtotal.
   - Click **"View Order & Checkout"** to view itemized rows, quantity `+`/`-` controls, tax (5%), delivery fee, and grand total.
   - Submitting the order posts to `/api/orders` and opens WhatsApp with the formatted order slip for direct kitchen preparation!

5. **Table Reservation**:
   - Books table/traditional majlis seating, generates a Booking ID (`TAS-RES-XXXX`), and sends WhatsApp confirmation.

6. **Customer Reviews**:
   - Click **"★ Leave a Review"** to submit a rating (1 to 5 stars) and review text. Live updates the average rating (4.3★) and review count (872+).
