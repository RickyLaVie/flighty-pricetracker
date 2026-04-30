## Context

The flight-price-tracker already has a scrape orchestrator (`lib/scraper/orchestrator.ts`) and a `runScrapeForRoute(routeId)` function. Scraping a single route sequentially across Google Flights and Skyscanner takes roughly 30–90 seconds. The dashboard's `RouteCard` component needs a way to trigger this on demand and reflect the updated price.

## Goals / Non-Goals

**Goals:**

- Expose `POST /api/routes/[id]/refresh` to trigger an immediate single-route scrape
- Return the updated latest price in the response so the UI can refresh inline
- Bypass the 00:00–06:00 blackout window (manual action overrides scheduler policy)
- Show loading state in the button during the scrape

**Non-Goals:**

- Bulk refresh of all routes at once (per-route only)
- Rate-limiting the refresh endpoint (personal-use project, low abuse risk)
- WebSocket or SSE streaming of real-time scrape progress

## Decisions

### Synchronous response (wait for scrape to finish)

**Decision**: The `POST /api/routes/[id]/refresh` endpoint runs the scrape inline and returns the updated price in the response body (200 OK with `{ price, currency, last_checked }`). The UI awaits this response before clearing the loading state.

**Rationale**: The scrape takes 30–90 seconds — acceptable for an explicit user action. A synchronous response avoids the need for polling or WebSocket infrastructure. Next.js API routes can handle long-running requests without a separate worker queue.

**Alternatives considered**:
- 202 Accepted + polling: adds complexity (polling endpoint, retry logic) without benefit at this scale.
- Server-Sent Events: overkill for a one-shot action.

### Button placement per Route card (not global)

**Decision**: The "Refresh Now" button is placed inside each `RouteCard`, triggering a refresh only for that specific route.

**Rationale**: Matches user intent — users typically want to check a specific route they're watching, not all routes simultaneously. A global "refresh all" button would chain sequential scrapes (2–4 min total) with no clear progress indication.
