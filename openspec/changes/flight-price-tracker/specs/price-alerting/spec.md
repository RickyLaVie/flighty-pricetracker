## ADDED Requirements

### Requirement: System computes 30-day rolling average as alert baseline

The system SHALL compute the alert baseline for each route as the average of all price snapshots recorded within the past 30 days for that route. If fewer than 30 days of data are available, the system SHALL NOT trigger threshold-based alerts and SHALL display "Insufficient data" instead.

#### Scenario: Baseline computed from 30-day history

- **WHEN** a route has at least 30 days of price snapshots
- **THEN** the system SHALL compute the rolling average as the mean of all snapshot prices in the past 30 days

#### Scenario: Insufficient history suppresses alerts

- **WHEN** a route has fewer than 30 days of price history
- **THEN** the system SHALL skip threshold evaluation for that route and SHALL NOT send any price alerts

### Requirement: System triggers tiered alerts based on price drop percentage

The system SHALL evaluate each new price snapshot against the 30-day rolling average and trigger a Line Bot notification when the snapshot price falls below the threshold for each tier.

Tier definitions:
- **Tier 1 (Good Deal)**: snapshot price ≤ 80% of average (drop ≥ 20%)
- **Tier 2 (Great Deal)**: snapshot price ≤ 70% of average (drop ≥ 30%)
- **Tier 3 (Flash Sale)**: snapshot price ≤ 60% of average (drop ≥ 40%)

The system SHALL send exactly one notification per tier per route per scrape run. If a price qualifies for multiple tiers, the system SHALL send only the notification for the highest-matching tier.

#### Scenario: Tier 1 alert triggered

- **WHEN** a new snapshot price is between 70% and 80% (inclusive) of the 30-day average
- **THEN** the system SHALL send a Tier 1 "Good Deal" Line Bot alert for that route

#### Scenario: Tier 3 overrides lower tiers

- **WHEN** a new snapshot price is ≤ 60% of the 30-day average
- **THEN** the system SHALL send only the Tier 3 "Flash Sale" alert, not Tier 1 or Tier 2

##### Example: tier assignment

| 30-day avg | Snapshot price | Percentage of avg | Tier triggered |
|------------|---------------|-------------------|----------------|
| $10,000 | $7,999 | 80.0% | None |
| $10,000 | $7,999 | 80.0% | None (threshold is ≤ 80%) |
| $10,000 | $8,000 | 80.0% | Tier 1 — Good Deal |
| $10,000 | $7,000 | 70.0% | Tier 2 — Great Deal |
| $10,000 | $5,999 | 59.99% | Tier 3 — Flash Sale |
| $10,000 | $6,000 | 60.0% | Tier 3 — Flash Sale |

### Requirement: System suppresses duplicate alerts within a cooldown window

The system SHALL NOT send the same tier alert for the same route more than once within a 12-hour cooldown window, even if subsequent scrape runs confirm the same price level.

#### Scenario: Duplicate alert suppressed

- **WHEN** a Tier 1 alert was sent for a route within the past 12 hours
- **THEN** the system SHALL NOT send another Tier 1 alert for that route until the cooldown expires

#### Scenario: Higher tier alert overrides cooldown

- **WHEN** a Tier 1 alert was sent and within the cooldown window the price drops further to Tier 3
- **THEN** the system SHALL send a Tier 3 alert immediately, resetting the cooldown for that route
