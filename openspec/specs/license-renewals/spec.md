# License Renewals

## Overview
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

### Requirement: Renewal reminder windows
The system SHALL support configurable reminder windows (e.g., 60/30/7 days before renewal).

### Requirement: Renewal outreach tracking
The system SHOULD allow tracking outreach attempts related to a renewal.

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
