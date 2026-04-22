## ADDED Requirements

### Requirement: Gmail integration can be disabled
The system SHALL allow running without Gmail integration enabled.

#### Scenario: App works without Gmail
- **WHEN** Gmail integration is not configured
- **THEN** the user can still manage leads, cadences, and reminders

### Requirement: Compose email from cadence step
The system SHALL provide an email compose experience that pre-fills subject/body from a cadence step when Gmail integration is enabled.

#### Scenario: Prefill composer
- **WHEN** the user opens compose for a due cadence step
- **THEN** the subject and body are pre-filled from the cadence templates
