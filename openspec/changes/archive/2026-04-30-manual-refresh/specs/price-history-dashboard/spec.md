## MODIFIED Requirements

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
