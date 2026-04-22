# Leads

## Overview
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

### Requirement: Lead status lifecycle
The system SHALL support a lead status lifecycle suitable for cold outreach and deal progression.

The system SHALL support at least these statuses:
- new
- contacted
- awaiting-reply
- follow-up-needed
- in-discussion
- won
- lost

### Requirement: Deduplication
The system SHOULD warn on potential duplicates when a lead with the same `primaryEmail` already exists.

### Requirement: Soft delete
The system SHOULD implement soft delete for leads.

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
