# Leads

## Purpose
This domain covers storing and managing commercial leads and their lifecycle.

## Data model (logical)
- Lead
  - id
  - name
  - company
  - primaryEmail
  - secondaryEmails[]
  - phone
  - website
  - source
  - status
  - tags[]
  - notes (free text)
  - createdAt
  - updatedAt
  - lastContactedAt
  - nextActionAt (optional)
## Requirements
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

### Requirement: Deduplication
The system SHALL warn on potential duplicates when a lead with the same `primaryEmail` already exists.

#### Scenario: Creating a lead warns on duplicate email
- **WHEN** the user creates a lead with an email that already exists as another lead's `primaryEmail`
- **THEN** the system warns the user about the potential duplicate

### Requirement: Soft delete
The system SHALL implement soft delete for leads.

#### Scenario: Delete an old lead
- **WHEN** the user deletes the lead
- **THEN** the lead is removed from default views

### Requirement: Company-centric stages
The system SHALL support a company-centric pipeline stage for board-based management.

#### Scenario: Stage shown on board
- **WHEN** the user views the company board
- **THEN** each company appears in a column matching its current stage

## Scenarios
### Scenario: Add a new lead
- GIVEN the user is on the Leads screen
- WHEN the user creates a lead with at least a name or a company and one contact method
- THEN the lead is persisted
- AND the lead appears in the lead list

### Scenario: Delete an old lead
- GIVEN an existing lead
- WHEN the user deletes the lead
- THEN the lead is removed from default views
- AND the lead can be restored until permanent deletion is implemented

### Scenario: Update lead status after an email
- GIVEN a lead in status `new`
- WHEN the user logs an outbound email or marks an email step as sent
- THEN the lead status becomes `contacted`
- AND `lastContactedAt` is updated
