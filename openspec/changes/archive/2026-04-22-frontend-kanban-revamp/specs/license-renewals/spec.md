## Purpose
This spec extends renewal reminders to company lines/contracts and surfaces renewal alerts on company cards.

## Requirements

## ADDED Requirements

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
