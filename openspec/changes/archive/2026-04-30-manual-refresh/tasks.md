## 1. API Endpoint

- [x] 1.1 Create `app/api/routes/[id]/refresh/route.ts` implementing synchronous response (wait for scrape to finish): POST handler looks up route by id, returns 404 if not found or inactive; calls `runScrapeForRoute(id)` synchronously; after completion queries `prisma.priceSnapshot.findFirst({ where: { route_id: id }, orderBy: { scraped_at: "desc" } })` and returns `{ price, currency, last_checked }` (all null if no snapshot) — satisfies "System provides an on-demand scrape endpoint" requirement

## 2. Dashboard UI

- [x] 2.1 Button placement per Route card (not global): add a "Refresh Now" button to `components/RouteCard.tsx` (satisfies "Dashboard allows adding and managing routes inline" requirement); add `refreshing` boolean state (default false); on click set `refreshing = true`, call `POST /api/routes/[route.id]/refresh`, on response update `latest_price`, `latest_currency`, `last_checked` inline via `onUpdated` callback and set `refreshing = false`; disable the button while `refreshing === true` and show "Refreshing…" label — satisfies "Refresh route from dashboard" and "Refresh button disabled during loading" scenarios
