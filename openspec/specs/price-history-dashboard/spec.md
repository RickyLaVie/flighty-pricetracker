## ADDED Requirements

### Requirement: Dashboard displays all active tracked routes

The system SHALL render a dashboard page listing all active tracked routes. Each route entry SHALL show origin, destination, date range, current lowest price, last checked timestamp, and a link to the route's price history chart.

#### Scenario: Dashboard loads with active routes

- **WHEN** the user navigates to the dashboard
- **THEN** the system SHALL display all active routes sorted by last-checked timestamp descending

#### Scenario: Dashboard empty state

- **WHEN** no routes are being tracked
- **THEN** the system SHALL display an empty state with a call-to-action to add the first route

### Requirement: Dashboard displays price history chart per route

The system SHALL render a line chart for each route showing price snapshots over the past 30 days. The chart SHALL also display the 30-day rolling average as a reference line.

#### Scenario: Price history chart renders with data

- **WHEN** the user opens a route's detail page
- **THEN** the system SHALL display a line chart with individual price snapshots and the rolling average line overlaid

#### Scenario: Chart shows insufficient data state

- **WHEN** a route has fewer than 30 days of price history
- **THEN** the system SHALL render the available data points and display a notice: "Building baseline — alerts will activate after 30 days of data"

### Requirement: Dashboard allows adding and managing routes inline

The system SHALL provide an "Add Route" form on the dashboard that allows the user to specify origin, destination, and date range without navigating away. The dashboard SHALL also provide edit, delete, and **refresh** controls for each existing route. The **refresh** control SHALL trigger an immediate on-demand scrape for that route and update the displayed price inline upon completion.

#### Scenario: Add route from dashboard

- **WHEN** the user fills in the Add Route form and submits
- **THEN** the system SHALL create the route and immediately show it in the route list

#### Scenario: Delete route from dashboard

- **WHEN** the user clicks the delete button for a route and confirms
- **THEN** the system SHALL remove the route from the active list; the route SHALL no longer appear in the dashboard

#### Scenario: Refresh route from dashboard

- **WHEN** the user clicks the "Refresh Now" button on a route card
- **THEN** the system SHALL show a loading indicator on the button, call `POST /api/routes/[id]/refresh`, and update the displayed price and last-checked timestamp once the response is received

#### Scenario: Refresh button disabled during loading

- **WHEN** a refresh is in progress for a route
- **THEN** the "Refresh Now" button SHALL be disabled until the response is received, preventing duplicate concurrent requests for the same route

## Requirements

