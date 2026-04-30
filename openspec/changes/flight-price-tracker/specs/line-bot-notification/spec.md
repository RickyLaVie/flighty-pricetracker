## ADDED Requirements

### Requirement: System sends tiered price alert messages via Line Bot

The system SHALL send a push message to the configured Line user ID when a price alert is triggered. Each message SHALL include the route (origin → destination), departure date range, current price, 30-day average price, percentage drop, tier label, and a direct link to search results.

#### Scenario: Tier 1 alert message sent

- **WHEN** a Tier 1 Good Deal alert is triggered for TPE → NRT
- **THEN** the system SHALL push a Line message containing the route, price (e.g., TWD 8,000), average (e.g., TWD 10,000), drop percentage (20%), tier label "✈ Good Deal", and a Google Flights search URL

#### Scenario: Tier 3 Flash Sale message uses distinct label

- **WHEN** a Tier 3 Flash Sale alert is triggered
- **THEN** the system SHALL push a Line message with tier label "🚨 Flash Sale — Abnormally Cheap" to distinguish it from lower tiers

### Requirement: System sends scraper failure alert via Line Bot

The system SHALL push a Line Bot message when a route has 2 or more consecutive failed scrape runs, informing the user which route is affected and the timestamp of the last successful scrape.

#### Scenario: Scraper failure notification

- **WHEN** a route has failed 2 consecutive scrape runs
- **THEN** the system SHALL push a Line message: "⚠ Scraper failure: TPE → NRT — no data since [timestamp]. Please check the scraper."

### Requirement: User can query current tracking status via Line Bot

The system SHALL respond to the Line Bot message "status" with a summary of all active tracked routes, showing origin, destination, date range, last scraped price, and last checked time.

#### Scenario: Status query response

- **WHEN** the user sends the message "status" to the Line Bot
- **THEN** the system SHALL reply with a formatted list of all active routes and their latest price data

#### Scenario: Unknown command response

- **WHEN** the user sends a message that is not a recognized command
- **THEN** the system SHALL reply with a help message listing available commands
