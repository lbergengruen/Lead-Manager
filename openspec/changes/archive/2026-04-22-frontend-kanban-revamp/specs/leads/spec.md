## MODIFIED Requirements

### Requirement: Create and manage leads
The system SHALL allow a user to create, view, edit, and delete leads.

#### Scenario: Create a company with contacts from a lead
- **WHEN** the user creates a company and adds one or more contacts
- **THEN** the system persists the company and its contacts

#### Scenario: Edit contacts from company modal
- **WHEN** the user edits a contact within the company details modal
- **THEN** the system persists the updated contact information

### Requirement: Lead status lifecycle
The system SHALL support a lead status lifecycle suitable for cold outreach and deal progression.

#### Scenario: Status lifecycle remains supported
- **WHEN** the user views a lead
- **THEN** the lead shows a status from the supported lifecycle

## ADDED Requirements

### Requirement: Company-centric stages
The system SHALL support a company-centric pipeline stage for board-based management.

#### Scenario: Stage shown on board
- **WHEN** the user views the company board
- **THEN** each company appears in a column matching its current stage
