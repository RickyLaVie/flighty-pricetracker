## Why

The 4-hour scrape cycle means users may wait up to 4 hours to see the latest price for a route they're actively watching. A manual refresh button lets users trigger an immediate on-demand scrape for any tracked route without waiting for the next scheduled cycle.

## What Changes

- New API endpoint `POST /api/routes/[id]/refresh` that triggers an immediate scrape for a single route, bypassing the scheduled cycle and the 00:00–06:00 blackout window
- New "Refresh Now" button on each Route card in the dashboard; shows a loading spinner while the scrape is in progress and updates the displayed price on completion

## Capabilities

### New Capabilities

- `on-demand-scraping`: User-triggered API endpoint that immediately runs the scrape orchestrator for a single route and returns the updated price data

### Modified Capabilities

- `price-history-dashboard`: Route cards gain a "Refresh Now" button that calls the on-demand scraping endpoint and refreshes the displayed price without navigating away

## Impact

- Affected specs: on-demand-scraping (new), price-history-dashboard (modified)
- Affected code:
  - New: app/api/routes/[id]/refresh/route.ts
  - Modified: components/RouteCard.tsx
  - Modified: openspec/changes/manual-refresh/specs/price-history-dashboard/spec.md
