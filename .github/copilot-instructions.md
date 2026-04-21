---
name: shuttle-club-workspace
description: SHUTTLE CLUB — Badminton court booking system. Vanilla HTML/CSS/JS. No framework, no build step. Guidance for adding features, fixing bugs, or extending functionality.
---

# SHUTTLE CLUB Workspace Instructions

## Project Overview

**SHUTTLE CLUB** is a badminton court booking system with:
- 12 courts, 10:00–24:00 hours  
- Dynamic pricing (Off-peak ฿150 / Peak ฿250 / Late night ฿200)
- Admin panel (password-protected)
- Booking history lookup by phone
- **Tech**: Pure HTML/CSS/JavaScript — no framework, no build tools, no dependencies

**Deployment**: Static files only → deploy to Netlify, Vercel, GitHub Pages, or any static host.

---

## Architecture & Key Files

### File Roles

| File | Purpose | Owner | Key Patterns |
|------|---------|-------|--------------|
| `index.html` | UI shell + page templates | Frontend | Semantic HTML, CSS variables, data attributes |
| `styles.css` | All styling + theme variables | Frontend | CSS custom properties (`:root`), BEM naming |
| `app.js` | Logic: booking, admin, storage, UI updates | Logic | Global state object, CONFIG at top, section comments |
| `README.md` | User-facing guide (Thai) | Docs | Deployment, customization, feature roadmap |

### State & Storage

**Location**: JavaScript global object `state` (app.js ~line 20)
```javascript
const state = {
  selectedDate: null,      // 'YYYY-MM-DD'
  selectedSlots: [],       // [{court, hour, price}]
  bookings: [],            // from localStorage
  currentPage: 'home',     // 'home' | 'booking' | 'history' | 'admin'
  admin: { loggedIn: false }
};
```

**Persistence**: `localStorage` with key `CONFIG.storageKey` ('shuttle_club_bookings_v1')
- ✅ **Data is per-browser only** (no sync between users)
- ✅ Good for: demo, internal-only use
- ⚠️  Not suitable for: multi-user production (requires backend + database)

**Booking Object**:
```javascript
{
  id: 'BK1234567',           // ID format
  date: '2026-04-19',        // YYYY-MM-DD
  slots: [{court, hour, price}, ...],  // Selected court × time slots
  total: 400,                // Sum of prices
  name: 'คุณ...',            // Thai name
  phone: '08...',            // Phone (primary lookup key)
  note: '',                  // Optional notes
  status: 'confirmed',       // 'pending' | 'confirmed' | 'cancelled'
  createdAt: 1713590000000   // Timestamp
}
```

---

## Configuration & Customization

All tunable parameters are in the `CONFIG` object (app.js, top of file):

```javascript
const CONFIG = {
  courts: 12,                          // Number of courts
  openHour: 10,                        // Opening hour (24-hour)
  closeHour: 24,                       // Closing hour
  pricing: (hour) => { ... },          // Price per hour
  adminPassword: 'admin1234',          // ⚠️ Change for production
  storageKey: 'shuttle_club_bookings_v1' // localStorage key
};
```

### Common Customizations

| Need | Location | Example |
|------|----------|---------|
| Change court count | `CONFIG.courts` | 10 or 20 courts |
| Change hours | `CONFIG.openHour`, `CONFIG.closeHour` | 9–22 |
| Adjust pricing | `CONFIG.pricing()` function | Different rates per time |
| Change admin password | `CONFIG.adminPassword` | 'newPass123' |
| Change theme colors | `styles.css` `:root` | `--gold: #ffaa00` |

---

## Development Workflow

### Running Locally

No build step needed! Use any local server:

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000

# Node (if installed)
npx serve .
# then open http://localhost:5000

# Or just open index.html in browser
open index.html  # macOS
start index.html # Windows
```

### Code Structure in app.js

The file is organized into sections (marked by `// ===== SECTION =====`):

1. **CONFIG** – Configuration constants
2. **STATE** – Global state object
3. **STORAGE** – `loadBookings()`, `saveBookings()`, `seedDemoData()`
4. **UTILITIES** – Formatting, date/time helpers
5. **NAVIGATION** – Page switching logic
6. **BOOKING LOGIC** – Slot selection, price calculation
7. **ADMIN LOGIC** – Password check, data management
8. **HISTORY LOGIC** – Phone lookup, filtering
9. **UI RENDERING** – Re-rendering after state changes
10. **EVENT LISTENERS** – DOM event handlers

When making changes: **find or add to the relevant section**, keep related functions close.

---

## Common Tasks

### Add a New Pricing Tier

Update `CONFIG.pricing()` function:

```javascript
pricing: (hour) => {
  if (hour >= 10 && hour < 14) return 100;   // NEW: early morning discount
  if (hour >= 14 && hour < 16) return 150;   // existing off-peak
  if (hour >= 16 && hour < 21) return 250;   // existing peak
  return 200;                                 // existing late night
}
```

### Add a New Admin Feature

1. Add UI in `index.html` (inside `#page-admin` section)
2. Add rendering function in app.js under **ADMIN LOGIC** section
3. Add event listener handling
4. Call the rendering function after admin login

### Change the Number of Courts

Update `CONFIG.courts = X` and the slot grid will auto-layout.

### Deploy to Production  

1. Push files to GitHub, Netlify, Vercel, or GitHub Pages
2. **Security note**: Change `CONFIG.adminPassword` before deploying
3. **Data note**: If multi-user sharing needed, integrate Firebase Firestore or Supabase (see README for details)

---

## Important Constraints & Pitfalls

⚠️ **Client-side only**: No backend = anyone can inspect admin password. Suitable for internal use only.

⚠️ **Single browser**: localStorage is per-browser instance. Multi-device sharing requires database.

⚠️ **Data loss on clear**: Users clearing browser cache lose all bookings.

⚠️ **Thai locale**: Date formatting uses Thai calendar (543 years ahead). See `fmtDate()` function.

---

## Testing a New Feature

1. Open `http://localhost:8000` 
2. Make UI changes in `index.html` + styling in `styles.css`
3. Add logic in `app.js` under appropriate section
4. Refresh browser (Ctrl+Shift+R for hard refresh to bypass cache)
5. Open DevTools console (F12) to check for errors
6. Test in Admin mode (login with password)

---

## Useful Helper Functions

Located in **UTILITIES** section:

- `fmtDate(dateStr)` – Convert ISO date to Thai format ("วันจันทร์ที่ 20 เม.ย. 2569")
- `fmtHour(h)` – Format hour as "10:00"
- `fmtSlot(hour)` – Format time slot as "10:00–11:00"
- `todayStr()` – Current date as 'YYYY-MM-DD'
- `genId()` – Generate unique booking ID

---

## Links

- 📖 [README](README.md) – User guide + feature roadmap
- 🎨 [styles.css](styles.css) – Theme colors + CSS variables at top
- 📋 [app.js](app.js) – All logic & configuration
- 📱 [index.html](index.html) – HTML structure & page templates
