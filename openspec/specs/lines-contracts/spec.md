# lines-contracts Specification

## Purpose
TBD - created by archiving change frontend-kanban-revamp. Update Purpose after archive.
## Requirements
### Requirement: Client lines and contracts
The system SHALL allow defining one or more Lines for a client company, each with its own contract dates and price per month.

#### Scenario: Add a line when becoming a client
- **WHEN** the user moves a company into the Client column
- **THEN** the system requires the user to add at least one Line with contract start date, end date, and monthly price

### Requirement: Contract renewal alerts
The system SHALL create an alert one month before a contract end date for any Line.

#### Scenario: Renewal alert created
- **WHEN** a Line contract end date is 30 days away
- **THEN** the system creates (or ensures existence of) a renewal reminder for that Line

### Requirement: Invoice tracking per line
The system SHALL allow marking whether each Line has been invoiced.

#### Scenario: Mark line invoiced
- **WHEN** the user marks a Line as invoiced
- **THEN** the system persists the invoiced status

#### Scenario: Company card shows missing invoices
- **WHEN** one or more Lines for a company are not invoiced
- **THEN** the company card shows an invoice indicator until all Lines are invoiced

