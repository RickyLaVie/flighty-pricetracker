## ADDED Requirements

### Requirement: User can add a tracked route

The system SHALL allow the user to add a new route to track by specifying origin airport, destination airport, and a date range (earliest departure date and latest departure date).

#### Scenario: Add a valid route

- **WHEN** the user submits origin "TPE", destination "NRT", departure range "2026-06-01" to "2026-06-30"
- **THEN** the system SHALL save the route and begin including it in scheduled scrape jobs

##### Example: valid route creation

- **GIVEN** origin = "TPE", destination = "NRT", date_from = "2026-06-01", date_to = "2026-06-30"
- **WHEN** the user submits the add-route form
- **THEN** a new route record is created with status = "active" and the route appears in the tracked routes list

#### Scenario: Reject route with invalid airport code

- **WHEN** the user submits an origin or destination that is not a valid 3-letter IATA code
- **THEN** the system SHALL reject the request and display an error message

#### Scenario: Reject route where date_to is before date_from

- **WHEN** the user submits a date range where date_to < date_from
- **THEN** the system SHALL reject the request and display a validation error

### Requirement: User can edit a tracked route

The system SHALL allow the user to update the date range of an existing tracked route.

#### Scenario: Edit route date range

- **WHEN** the user updates the date range of an existing route and submits
- **THEN** the system SHALL save the new date range and apply it to subsequent scrape jobs

### Requirement: User can delete a tracked route

The system SHALL allow the user to delete a tracked route, which stops future scraping for that route.

#### Scenario: Delete a route

- **WHEN** the user deletes a route
- **THEN** the system SHALL mark the route as inactive and exclude it from future scrape jobs; historical price data for the route SHALL be retained

### Requirement: User can view all tracked routes

The system SHALL display a list of all active tracked routes showing origin, destination, date range, and the most recently scraped price.

#### Scenario: View tracked routes list

- **WHEN** the user navigates to the routes page
- **THEN** the system SHALL display all active routes with their current lowest price and last-checked timestamp
