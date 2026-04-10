# Operation Claw & Order

> **A real-time cybersecurity operations dashboard for monitoring offensive security exercises.**

Operation Claw & Order is a high-density, single-page React application designed to be displayed on classroom screens and command-center monitors during live cyber-attack simulations. It provides instructors and exercise coordinators with a real-time tactical overview of every participating team's status, attack phase, active operations, and a scrolling event telemetry feed — all rendered in a dark, military-grade aesthetic.

---

## Features

- **Live Team Monitoring** — Track 12+ teams simultaneously with real-time status indicators (Online / Degraded / Offline / Unknown)
- **Attack Phase Visualization** — Visual progress bars showing each team's current incursion phase (Phases 1-3)
- **Active Operations Feed** — See the last command or tool each team executed
- **Live Telemetry Stream** — A scrolling terminal-style activity feed showing the 20 most recent events with color-coded results (SUCCESS / FAILED / BLOCKED)
- **Overall System Health Badge** — Aggregated fleet status: ALL SYSTEMS GO / DEGRADED / CRITICAL
- **Real-Time Clock** — UTC/local timestamp prominently displayed in the header
- **Client-Side Search** — Instantly filter teams by designation with a search bar
- **Responsive Dark Theme** — Custom Tailwind color palette designed for low-light environments and large displays

---

## Tech Stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| **Framework**| React 19 (via Vite 8)                       |
| **Styling**  | Tailwind CSS 3.4 + custom dark theme tokens |
| **Icons**    | Lucide React                                |
| **Backend**  | Node.js + Express 5                         |
| **Database** | PostgreSQL (optional, for event persistence)|
| **Hosting**  | Heroku                                      |

---

## Project Structure

```
operation-claw-and-order/
├── index.html                  # App shell
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite config + dev proxy
├── tailwind.config.js          # Custom dark theme color tokens
├── postcss.config.js           # PostCSS + Tailwind + Autoprefixer
├── Procfile                    # Heroku: web: npm start
├── .env.example                # Template for environment variables
│
├── public/
│   ├── favicon.svg             # Tab icon
│   └── icons.svg               # Icon sprite sheet
│
├── server/
│   ├── index.js                # Express server, API routes, auth
│   └── db.js                   # PostgreSQL connection & queries
│
└── src/
    ├── main.jsx                # React entry point
    ├── index.css               # Tailwind directives + scrollbar styles
    ├── mockData.js             # 12 mock teams + 20 mock events
    ├── components/
    │   ├── App.jsx             # Root layout orchestrator
    │   ├── HeaderBar.jsx       # Title, fleet metric, clock, status badge
    │   ├── StatusBadge.jsx     # ALL SYSTEMS GO / DEGRADED / CRITICAL
    │   ├── TeamList.jsx        # Searchable, scrollable team table
    │   ├── TeamRow.jsx         # Team row with live "last seen" timer
    │   ├── ActivityFeed.jsx    # Scrolling telemetry terminal
    │   └── EventRow.jsx        # Single event line in the feed
    ├── hooks/
    │   └── useDashboardData.js # Mock fallback + API polling
    └── assets/
        └── hero.png
```

---

## Deployment to Heroku

### 1. Create the Heroku app

```bash
heroku create your-app-name
```

### 2. Add Heroku Postgres (recommended)

Without this, events are stored in memory and lost on every dyno restart.

```bash
heroku addons:create heroku-postgresql:essential-0
```

This automatically sets `DATABASE_URL` for you.

### 3. Set config vars

**All config vars must be set BEFORE the first deploy** because `VITE_API_URL` is baked into the frontend at build time.

```bash
# Required: Your Heroku Platform API key (to fetch team app statuses)
heroku config:set HEROKU_API_KEY=your-heroku-api-key

# Required: Only show Heroku apps matching this prefix as teams
# e.g. if team apps are named ocrt-team-01, ocrt-team-02, etc.
heroku config:set TEAM_APP_PREFIX=ocrt-

# Required: The public URL of this app (so the frontend can reach the API)
heroku config:set VITE_API_URL=https://your-app-name.herokuapp.com

# Recommended: Protect the event POST endpoint with an API key
heroku config:set EVENT_API_KEY=a-strong-random-secret

# Required: Ensure devDependencies (Vite, Tailwind) are installed during build
heroku config:set NPM_CONFIG_PRODUCTION=false
```

### 4. Deploy

```bash
git push heroku main
```

### 5. Verify

```bash
heroku open
heroku logs --tail
```

---

## Environment Variables

| Variable            | Required | Description                                                       |
| ------------------- | -------- | ----------------------------------------------------------------- |
| `HEROKU_API_KEY`    | Yes      | Heroku Platform API key — used to fetch team app statuses         |
| `TEAM_APP_PREFIX`   | Yes      | Only Heroku apps whose name starts with this prefix appear as teams |
| `VITE_API_URL`      | Yes*     | Backend URL for the frontend to call. If empty, uses mock data    |
| `EVENT_API_KEY`     | Recommended | Bearer token required for `POST /api/events`. If empty, endpoint is open |
| `DATABASE_URL`      | Recommended | PostgreSQL connection string (auto-set by Heroku Postgres addon)  |
| `PORT`              | No       | Server port (Heroku sets this automatically; defaults to 3001)    |
| `NPM_CONFIG_PRODUCTION` | Yes  | Must be `false` so Heroku installs devDependencies for the build  |

*If `VITE_API_URL` is not set, the dashboard runs in mock mode with synthetic data.

---

## Local Development

### Prerequisites

- Node.js >= 20
- npm >= 9

### Quick start

```bash
git clone https://github.com/009182323-mango/OCRT.git
cd OCRT
npm install
cp .env.example .env
```

### Running locally

```bash
# Frontend only (mock mode, port 5173)
npm run dev

# Backend only (port 3001)
npm run server

# Full stack dev — Vite proxies /api to localhost:3001
# Run both commands in separate terminals:
npm run dev
npm run server

# Production simulation (build + serve on 3001)
npm run build-start
```

The Vite dev server automatically proxies `/api/*` requests to `localhost:3001`, so you don't need to set `VITE_API_URL` during local development.

---

## API Endpoints

| Method | Endpoint       | Auth             | Description                         |
| ------ | -------------- | ---------------- | ----------------------------------- |
| GET    | `/api/health`  | None             | Health check + persistence status   |
| GET    | `/api/status`  | None             | Array of team objects from Heroku   |
| GET    | `/api/events`  | None             | Last 100 events                     |
| POST   | `/api/events`  | Bearer token*    | Submit a new event                  |

*Only enforced when `EVENT_API_KEY` is set.

### POST /api/events body

```json
{
  "team_id": "ocrt-team-01",
  "tool": "Nmap",
  "target": "10.0.1.5",
  "result": "SUCCESS",
  "details": "Port 22, 80 open"
}
```

### POST /api/events with auth

```bash
curl -X POST https://your-app.herokuapp.com/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-event-api-key" \
  -d '{"team_id":"ocrt-team-01","tool":"Nmap","target":"10.0.1.5","result":"SUCCESS","details":"Port scan complete"}'
```

---

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start Vite dev server with HMR           |
| `npm run server`     | Start Express backend with nodemon       |
| `npm run build`      | Production build to `dist/`              |
| `npm run build-start`| Build frontend and serve via Express     |
| `npm start`          | Start Express backend (production mode)  |
| `npm run lint`       | Run ESLint across all source files       |

---

## Data Modes

### Mock Mode (default)

When `VITE_API_URL` is not set, the dashboard renders 12 pre-configured teams and 20 simulated events from `mockData.js`. New mock events are generated every 4 seconds, and online team statuses refresh every 15 seconds.

### Live API Mode

When `VITE_API_URL` is set, the hook polls the backend:

| Endpoint          | Poll Interval | Description                    |
| ----------------- | ------------- | ------------------------------ |
| `GET /api/status` | 15 seconds    | Array of team status objects   |
| `GET /api/events` | 4 seconds     | Array of recent event objects  |

---

## License

This project was built as part of a cybersecurity training exercise. All mock data is synthetic and does not represent real infrastructure.

---

<p align="center">
  <strong>OPERATION CLAW & ORDER</strong><br>
  <em>"Eyes on every vector. Control every phase."</em>
</p>
