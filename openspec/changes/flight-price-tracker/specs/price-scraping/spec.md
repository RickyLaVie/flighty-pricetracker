## ADDED Requirements

### Requirement: System scrapes prices on a scheduled interval

The system SHALL scrape prices for all active routes every 4 hours with a random offset of 0–30 minutes applied to each scheduled run. The scheduler SHALL NOT execute scrape jobs between 00:00 and 06:00 local time.

#### Scenario: Normal scheduled scrape

- **WHEN** the scheduler fires outside the 00:00–06:00 blackout window
- **THEN** the system SHALL initiate a scrape job for each active route and store the results

#### Scenario: Scrape suppressed during blackout window

- **WHEN** the scheduler would fire between 00:00 and 06:00
- **THEN** the system SHALL skip the scrape run and resume at the next scheduled interval after 06:00

##### Example: scheduling with random offset

| Scheduled time | Random offset | Actual execution | Blackout? |
|----------------|---------------|------------------|-----------|
| 08:00 | +17 min | 08:17 | No — executes |
| 02:00 | +5 min | 02:05 | Yes — skipped |
| 06:00 | +0 min | 06:00 | No — executes |

### Requirement: Routes departing within 7 days are scraped more frequently

The system SHALL increase the scrape frequency to every 2 hours for any route whose earliest departure date is within 7 days of the current date.

#### Scenario: Near-departure route scrapes at 2-hour interval

- **WHEN** a route has departure date ≤ 7 days from today
- **THEN** the scheduler SHALL run a scrape for that route every 2 hours instead of every 4 hours

### Requirement: Scraper fetches prices from Google Flights and Skyscanner

The system SHALL use Playwright to render Google Flights and Skyscanner pages for each route and extract the lowest available one-way fare.

#### Scenario: Successful price extraction

- **WHEN** the scraper loads the results page for a route
- **THEN** the system SHALL extract the lowest displayed price, the currency, and the airline name, and store them as a price snapshot with a UTC timestamp

#### Scenario: Scraper encounters no results

- **WHEN** the scraper loads a results page and finds no fare elements
- **THEN** the system SHALL record a failed scrape attempt and SHALL NOT store a price snapshot

### Requirement: System alerts on consecutive scrape failures

The system SHALL notify the user via Line Bot when a route has produced no successful price data for 2 or more consecutive scrape runs.

#### Scenario: Consecutive failure alert

- **WHEN** a route fails to return price data in 2 consecutive scrape attempts
- **THEN** the system SHALL send a Line Bot message indicating the scraper may be broken for that route
