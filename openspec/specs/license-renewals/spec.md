# License Renewals

## Purpose
Track client licenses/contracts and remind the user to reach out before renewal.

## Data model (logical)
- Client
  - id
  - name
  - primaryContactEmail
  - notes

- License
  - id
  - clientId
  - productName
  - startDate
  - renewalDate
  - renewalCadence (annual, monthly, custom)
  - status (active, canceled, expired)
## Requirements
### Requirement: Store licenses
The system SHALL allow creating, viewing, editing, and deleting licenses.

#### Scenario: Create a license
- **WHEN** the user creates a license for a client
- **THEN** the license is persisted

### Requirement: Renewal reminder windows
The system SHALL support configurable reminder windows (e.g., 60/30/7 days before renewal).

#### Scenario: Configure renewal reminder windows
- **WHEN** the user configures renewal reminder windows
- **THEN** the system stores the selected windows

### Requirement: Renewal outreach tracking
The system SHALL allow tracking outreach attempts related to a renewal.

#### Scenario: Record a renewal outreach attempt
- **WHEN** the user records an outreach attempt for a renewal
- **THEN** the outreach attempt is persisted

### Requirement: Contract renewal reminders per line
The system SHALL create a renewal reminder one month before the contract end date of any client Line.

#### Scenario: Line renewal reminder created
- **WHEN** a client Line contract end date is 30 days away
- **THEN** the system creates (or ensures existence of) a renewal reminder for that company

### Requirement: Contract renewal alerts on company cards
The system SHALL display an alert icon on a company card when any Line renewal reminder is due or overdue.

#### Scenario: Card shows renewal alert
- **WHEN** a company has a due or overdue renewal reminder for any of its Lines
- **THEN** the company card displays a contract renewal alert icon

## Scenarios
### Scenario: Create renewal reminders
- GIVEN a license with renewalDate in 30 days
- WHEN the system evaluates reminders
- THEN it creates or schedules a reminder for renewal outreach according to configured windows

### Scenario: Reschedule renewal outreach
- GIVEN a renewal reminder exists
- WHEN the user snoozes it to a later date
- THEN the system keeps the license renewal date unchanged
- AND the reminder is updated
