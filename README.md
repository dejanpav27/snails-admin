# Snails Admin — Phase 2

React admin dashboard for the Snails nail studio booking app.

---

## Project structure

```
snails-admin/
├── public/
│   └── index.html
├── src/
│   ├── index.js               ← React entry point
│   ├── index.css              ← Global styles + design tokens
│   ├── App.js                 ← Routes + auth guard
│   ├── lib/
│   │   ├── api.js             ← All API calls to the backend
│   │   ├── AuthContext.js     ← Login state, JWT management
│   │   └── utils.js           ← Date/price formatting helpers
│   ├── components/
│   │   ├── UI.js              ← Button, Card, Modal, Input, Badge, etc.
│   │   └── Sidebar.js         ← Navigation sidebar
│   └── pages/
│       ├── Login.js           ← Sign in screen
│       ├── Dashboard.js       ← Today's overview + stats
│       ├── Calendar.js        ← Weekly calendar view
│       ├── Bookings.js        ← All bookings with filters
│       ├── BookingDetail.js   ← Single booking + confirm/cancel
│       ├── Clients.js         ← Client list + search
│       ├── ClientDetail.js    ← Client profile + booking history
│       ├── Services.js        ← Service menu management
│       └── NewBooking.js      ← Create booking manually
└── package.json
```

---

## Setup

### 1. Make sure Phase 1 (the API) is running

```bash
cd ../snails-api
npm run dev
# API should be live at http://localhost:3001
```

### 2. Install dependencies

```bash
cd snails-admin
npm install
```

### 3. Create your .env file

```bash
cp .env.example .env
```

The default `REACT_APP_API_URL=http://localhost:3001` works for local dev.

### 4. Start the dashboard

```bash
npm start
# Opens at http://localhost:3000
```

Log in with the admin credentials you created in Phase 1.

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Today's stats, schedule, quick actions |
| `/calendar` | Calendar | Week view — all bookings at a glance |
| `/bookings` | Bookings | Full list, filter by date or status |
| `/bookings/:id` | Booking detail | Confirm, cancel, view details |
| `/clients` | Clients | Search, browse, add new clients |
| `/clients/:id` | Client profile | History, spend, edit details |
| `/services` | Services | Add, edit, enable/disable services |
| `/new` | New booking | Pick client → service → slot → confirm |

---

## Deploying to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set the environment variable:
   - `REACT_APP_API_URL` = your Railway backend URL (e.g. `https://snails-api.railway.app`)
4. Vercel auto-detects Create React App and builds it
5. Done — your girlfriend gets a URL she can bookmark

---

## Next: Phase 3

Phase 3 is the public client booking page — the link she shares with her clients so they can book themselves without messaging her.
