## 1. Project Setup

- [x] 1.1 Initialize Next.js project: use Next.js (App Router) as the full-stack framework — run `npx create-next-app@latest` with TypeScript, Tailwind CSS, and App Router options
- [x] 1.2 Install core dependencies: prisma, @prisma/client, playwright, node-cron, @line/bot-sdk, recharts, zod
- [x] 1.3 Use PostgreSQL with Prisma ORM for persistence: set up Prisma schema with models Route (id, origin, destination, date_from, date_to, status, created_at), PriceSnapshot (id, route_id, source, price, currency, airline, scraped_at), AlertLog (id, route_id, tier, sent_at)
- [x] 1.4 Configure PostgreSQL connection (DATABASE_URL env var) and run initial migration
- [x] 1.5 Set up environment variables: DATABASE_URL, LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, LINE_USER_ID, BASE_URL
- [x] 1.6 Use node-cron inside a Next.js custom server for scheduling: configure server.ts for Railway deployment so the cron scheduler process stays alive persistently

## 2. Route Tracking

- [x] 2.1 Implement Route database CRUD: create, update (date range), soft-delete (set status = inactive), list active routes — satisfies "User can add a tracked route", "User can edit a tracked route", "User can delete a tracked route", "User can view all tracked routes" requirements
- [x] 2.2 Implement POST /api/routes with Zod validation: require 3-letter IATA codes for origin/destination, require date_from ≤ date_to — satisfies "Reject route with invalid airport code" and "Reject route where date_to is before date_from" scenarios
- [x] 2.3 Implement GET /api/routes returning active routes with latest snapshot price and last_checked timestamp
- [x] 2.4 Implement PATCH /api/routes/[id] for date range updates and DELETE /api/routes/[id] for soft-delete

## 3. Price Scraping Engine

- [x] 3.1 Use Playwright for scraping (not Puppeteer or HTTP requests): implement scraper base with headless browser, randomized user-agent rotation (pool of 5 realistic desktop user-agents), randomized viewport (1280–1920 wide, 720–1080 tall), and 1–3 second random delay before interaction
- [x] 3.2 Implement Google Flights scraper: navigate to google.com/travel/flights with origin, destination, departure date; wait for fare elements using aria-label selectors; extract lowest price, currency, and airline name
- [x] 3.3 Implement Skyscanner scraper: navigate to skyscanner.net search results; wait for price card elements; extract lowest price, currency, and airline name
- [x] 3.4 Implement scrape orchestrator: for each active route, run both Google Flights and Skyscanner scrapers sequentially (not parallel), store each result as a PriceSnapshot, catch errors per-source without failing the whole run — satisfies "Scraper fetches prices from Google Flights and Skyscanner" requirement
- [x] 3.5 Implement consecutive failure detection: after each scrape run, check if a route has 0 successful snapshots in the last 2 consecutive runs; if so, trigger a Line Bot failure alert — satisfies "System alerts on consecutive scrape failures" requirement

## 4. Scheduler

- [x] 4.1 Implement cron scheduler in server.ts using node-cron: default job fires every 4 hours with a random offset (generate a random 0–30 minute delay at each invocation using setTimeout before calling the scrape orchestrator) — satisfies "System scrapes prices on a scheduled interval" requirement
- [x] 4.2 Implement blackout window check: before executing any scrape job, check current local hour; skip and log if hour is 0–5 (00:00–05:59) — satisfies "Scrape suppressed during blackout window" scenario
- [x] 4.3 Implement near-departure frequency override: routes where date_from is within 7 days of today use a separate 2-hour cron job instead of the 4-hour default — satisfies "Routes departing within 7 days are scraped more frequently" requirement

## 5. Price Alerting Engine

- [x] 5.1 Compute rolling 30-day average as the alert baseline: query PriceSnapshot for a route where scraped_at >= 30 days ago; compute mean price; return null if fewer than 30 days of data exist — satisfies "System computes 30-day rolling average as alert baseline" requirement
- [x] 5.2 Implement tier evaluator: given a snapshot price and 30-day average, return the highest matching tier (Tier 3 if ≤ 60%, Tier 2 if ≤ 70%, Tier 1 if ≤ 80%) or null if no tier is matched — satisfies "System triggers tiered alerts based on price drop percentage" requirement
- [x] 5.3 Implement cooldown check: before sending an alert, query AlertLog for the same route and tier within the past 12 hours; suppress if found; if a higher tier fires within cooldown, allow it and reset — satisfies "System suppresses duplicate alerts within a cooldown window" requirement
- [x] 5.4 Wire alert evaluation into scrape orchestrator: after each successful snapshot is stored, run rolling average calculator → tier evaluator → cooldown check → send Line Bot message if applicable

## 6. Line Bot Integration

- [x] 6.1 Line Bot as the sole notification channel: set up Line Messaging API by configuring @line/bot-sdk client with CHANNEL_ACCESS_TOKEN and CHANNEL_SECRET; implement POST /api/linebot/webhook endpoint with signature verification
- [x] 6.2 Implement tiered alert push messages: compose message with route, current price, 30-day average, percentage drop, tier label ("✈ Good Deal" / "✈ Great Deal" / "🚨 Flash Sale — Abnormally Cheap"), and Google Flights search URL — satisfies "System sends tiered price alert messages via Line Bot" requirement
- [x] 6.3 Implement scraper failure push message: compose message "⚠ Scraper failure: [origin] → [destination] — no data since [timestamp]. Please check the scraper." — satisfies "System sends scraper failure alert via Line Bot" requirement
- [x] 6.4 Implement "status" command handler in webhook: parse incoming text event; if text equals "status" (case-insensitive), reply with a formatted list of all active routes showing origin, destination, date range, latest price, and last checked time — satisfies "User can query current tracking status via Line Bot" requirement
- [x] 6.5 Implement fallback reply for unrecognized commands: if incoming text does not match any known command, reply with help message listing available commands ("status") — satisfies "Unknown command response" scenario

## 7. Price History Dashboard

- [x] 7.1 Implement dashboard page (app/page.tsx): fetch active routes with latest price data via GET /api/routes; render route cards with origin, destination, date range, current price, and last checked time sorted by last-checked descending — satisfies "Dashboard displays all active tracked routes" requirement
- [x] 7.2 Implement dashboard empty state: when route list is empty, render empty state UI with "No routes tracked yet" message and a prominent Add Route button — satisfies "Dashboard empty state" scenario
- [x] 7.3 Implement Add Route inline form on dashboard (satisfies "Dashboard allows adding and managing routes inline" requirement): form with origin, destination, date_from, date_to fields; submit to POST /api/routes; show inline validation errors; on success, refresh route list without page navigation
- [x] 7.4 Implement edit and delete controls per route card: edit opens an inline form pre-filled with current values; delete shows a confirmation dialog before calling DELETE /api/routes/[id] — satisfies "Delete route from dashboard" scenario
- [x] 7.5 Implement route detail page (app/routes/[id]/page.tsx): fetch all PriceSnapshot records for the route from the past 30 days via GET /api/routes/[id]/snapshots; render a Recharts line chart with individual price points and the 30-day rolling average as an overlaid reference line — satisfies "Dashboard displays price history chart per route" requirement
- [x] 7.6 Implement insufficient data notice on chart: when fewer than 30 days of snapshots exist, display notice "Building baseline — alerts will activate after 30 days of data" above the chart — satisfies "Chart shows insufficient data state" scenario

## 8. Deployment

- [x] 8.1 Write Railway configuration (railway.toml or Procfile) to start the custom Next.js server (node server.ts) instead of the default Vercel serverless handler
- [x] 8.2 Set all required environment variables in Railway: DATABASE_URL, LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, LINE_USER_ID, BASE_URL
- [x] 8.3 Register the Line Bot webhook URL in the Line Developers Console pointing to https://[BASE_URL]/api/linebot/webhook
- [x] 8.4 Run end-to-end smoke test: add one route via the dashboard, wait for the next scrape cycle to fire, confirm a PriceSnapshot is created, and verify the dashboard chart renders
