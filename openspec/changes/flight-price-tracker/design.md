## Context

A personal flight price tracking system for self-use and sharing with friends. There is no existing codebase — this is a greenfield project. The system must scrape prices from Google Flights and Skyscanner (both JavaScript-heavy SPAs), store historical data, and deliver tiered alerts via Line Bot. The primary constraint is avoiding IP bans while keeping operational cost low.

## Goals / Non-Goals

**Goals:**

- Provide a web UI for managing tracked routes and viewing price history charts
- Scrape Google Flights and Skyscanner using Playwright with anti-detection measures
- Compute rolling average price per route and trigger alerts at -20%, -30%, -40% thresholds
- Push tiered notifications to users via Line Messaging API
- Schedule scraping every 4 hours (±30 min random offset), pause 00:00–06:00, increase to every 2 hours for routes departing within 7 days

**Non-Goals:**

- Booking integration
- Additional data sources beyond Google Flights and Skyscanner
- Native mobile app
- Multi-user authentication system

## Decisions

### Use Next.js (App Router) as the full-stack framework

**Decision**: Next.js with App Router for both frontend and API routes, deployed to Vercel.

**Rationale**: A single TypeScript codebase covers UI, API, and background logic. Vercel's free tier handles the hosting. App Router enables server components for fast initial loads.

**Alternatives considered**:
- Separate React SPA + Express backend: more flexibility but doubles deployment complexity for a personal project.
- Remix: similar DX but smaller ecosystem and less Vercel-native.

### Use Playwright for scraping (not Puppeteer or HTTP requests)

**Decision**: Playwright with stealth configuration (randomized viewport, user-agent rotation, realistic mouse/keyboard delays).

**Rationale**: Both Google Flights and Skyscanner are client-rendered SPAs; raw HTTP requests return empty shells. Playwright renders JavaScript and can wait for price elements to appear. Stealth mode reduces bot-detection risk.

**Alternatives considered**:
- Puppeteer: similar capability, but Playwright has better cross-browser support and a more ergonomic API.
- Amadeus / Kiwi API: legitimate but Skyscanner API is not open to individuals; Amadeus free tier is limited. Scraping gives broader coverage.

### Use PostgreSQL with Prisma ORM for persistence

**Decision**: PostgreSQL (hosted on Railway free tier) with Prisma as the ORM.

**Rationale**: Price history is append-only time-series data with structured relations (routes → price snapshots). PostgreSQL handles this well. Prisma provides type-safe queries and easy migrations.

**Alternatives considered**:
- SQLite: simpler but not suitable for concurrent writes from cron jobs and web requests.
- MongoDB: flexible schema not needed here; structured relational data fits SQL better.

### Use node-cron inside a Next.js custom server for scheduling

**Decision**: A long-running Next.js custom server (`server.ts`) with node-cron for scheduling scrape jobs.

**Rationale**: Vercel serverless functions cannot maintain persistent cron state. A custom server on Railway keeps the cron scheduler alive and co-located with the API.

**Alternatives considered**:
- Vercel Cron Jobs: limited to 1-minute minimum interval on free tier; no random offset support.
- Separate worker process: adds deployment complexity without meaningful benefit at this scale.

### Compute rolling 30-day average as the alert baseline

**Decision**: Alert thresholds (-20%, -30%, -40%) are computed against the 30-day rolling average price for each route+date combination.

**Rationale**: A 30-day window smooths short-term volatility while remaining responsive to seasonal trends. Using the historical minimum would trigger too many false positives.

**Alternatives considered**:
- User-defined target price: simpler but requires upfront manual research from the user.
- 7-day average: too volatile; a single flash sale skews the baseline.

### Line Bot as the sole notification channel

**Decision**: Line Messaging API (push messages) for all alerts. No email, no browser push.

**Rationale**: User preference. Line is already installed on target users' phones, requires no additional app, and supports rich message templates (Flex Messages) for structured price cards.

## Risks / Trade-offs

- [Scraper breakage] Google Flights and Skyscanner update their DOM frequently → Mitigation: use semantic selectors (aria-labels, data-testid) over positional CSS; add error alerting when scrape yields no results for 2+ consecutive runs.
- [IP ban] Excessive scraping frequency triggers rate-limiting → Mitigation: 4-hour interval, random offset, single residential-looking request per scrape session, no concurrent parallel scrapes for the same source.
- [Cold start latency] Railway free tier may spin down the container → Mitigation: set Railway to always-on (within free quota); if unavailable, accept occasional missed scrape cycles.
- [30-day baseline accuracy] New routes have insufficient history for the first month → Mitigation: display "Insufficient data (< 30 days)" instead of alert thresholds until baseline is established; still store prices.

## Migration Plan

1. Initialize Next.js project and Prisma schema
2. Deploy PostgreSQL on Railway, configure DATABASE_URL
3. Implement and test scraper locally against both sources
4. Implement cron scheduler and wire to scraper
5. Implement alerting engine and Line Bot webhook
6. Build Web UI (route management + price charts)
7. Deploy to Railway (custom server) and verify end-to-end
8. No rollback strategy needed — greenfield project with no existing users
