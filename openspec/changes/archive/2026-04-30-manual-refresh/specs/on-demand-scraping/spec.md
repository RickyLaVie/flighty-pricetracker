## ADDED Requirements

### Requirement: System provides an on-demand scrape endpoint

The system SHALL expose a `POST /api/routes/[id]/refresh` endpoint that immediately runs the scrape orchestrator for the specified route and returns the updated price data. This endpoint SHALL bypass the scheduled blackout window — it executes regardless of the current hour.

#### Scenario: Successful on-demand scrape

- **WHEN** the user calls `POST /api/routes/[id]/refresh` for an active route
- **THEN** the system SHALL run the scrape orchestrator for that route, store any new PriceSnapshot records, and return `{ price, currency, last_checked }` reflecting the most recently stored snapshot

##### Example: successful refresh response

- **GIVEN** route TPE → NRT with route_id = "abc123"
- **WHEN** `POST /api/routes/abc123/refresh` is called
- **THEN** response is `200 OK` with body `{ "price": 8500, "currency": "TWD", "last_checked": "2026-04-30T10:15:00.000Z" }`

#### Scenario: Refresh for inactive or non-existent route

- **WHEN** the user calls `POST /api/routes/[id]/refresh` for a route that does not exist or has status "inactive"
- **THEN** the system SHALL return `404 Not Found`

#### Scenario: Scrape yields no results

- **WHEN** both scrapers return no data during a manual refresh
- **THEN** the system SHALL return `200 OK` with `{ "price": null, "currency": null, "last_checked": null }` and SHALL NOT store a PriceSnapshot
