# License Renewals

## Purpose
Track client licenses and generate renewal outreach reminders based on configurable windows.

## Requirements

## ADDED Requirements

### Requirement: Renewal reminder windows configuration
The system SHALL allow configuring one or more reminder windows (in days) for licenses (e.g., 60, 30, 7).

#### Scenario: Configure reminder windows
- **WHEN** the user sets renewal reminder windows to 60, 30, and 7 days
- **THEN** the system persists the configuration

### Requirement: Renewal reminders generated from windows
The system SHALL create renewal reminders for each configured window when a license renewal is upcoming.

#### Scenario: 30-day renewal reminder created
- **WHEN** a license renewal date is exactly 30 days away
- **THEN** the system creates (or ensures existence of) a renewal reminder for that license
