## Purpose
This spec covers strategy assignment and due outreach tracking for company-centric workflows.

## Requirements

## MODIFIED Requirements

### Requirement: Strategy assignment drives due outreach
The system SHALL allow assigning a Strategy to a company when it enters the Contacted stage and compute when the next outreach is due.

#### Scenario: Choosing a strategy when moving to Contacted
- **WHEN** the user moves a company card from Dead Leads to Contacted
- **THEN** the system requires selecting a Strategy
- **AND** the system schedules the next outreach due time based on the Strategy

### Requirement: Due outreach is surfaced on the company card
The system SHALL surface due outreach as an alert on the company card until the user acknowledges the outreach.

#### Scenario: Due alert persists until acknowledged
- **WHEN** the next outreach due time for a company has arrived
- **THEN** the company card shows a due outreach alert
- **AND** the alert remains until the user opens the company modal and records a re-contact action with a date

### Requirement: Copyable email template
The system SHALL allow copying the required email template for the currently due strategy email.

#### Scenario: Copy email contents
- **WHEN** the user opens a company modal with a due outreach alert
- **THEN** the system shows the due email template
- **AND** the user can copy the subject and body text
