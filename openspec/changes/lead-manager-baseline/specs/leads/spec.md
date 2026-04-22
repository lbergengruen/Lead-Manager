## ADDED Requirements

### Requirement: Lead list and search
The system SHALL provide a leads list view with basic filtering/search by name, company, or email.

#### Scenario: Search by company
- **WHEN** the user searches for a company substring
- **THEN** the system shows only leads whose company matches the query

### Requirement: Lead status tracking
The system SHALL allow updating a lead’s status and viewing it in the leads list.

#### Scenario: Update lead status
- **WHEN** the user changes a lead’s status from `new` to `contacted`
- **THEN** the system persists the new status

### Requirement: Lead contact timestamps
The system SHALL record `lastContactedAt` when an outbound email activity is logged for a lead.

#### Scenario: Logging an email updates last contacted
- **WHEN** the user logs an outbound email activity for a lead
- **THEN** the system sets `lastContactedAt` to the time of logging
