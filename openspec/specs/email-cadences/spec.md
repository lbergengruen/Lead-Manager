# Email Cadences (Strategies)

## Purpose
A cadence is a strategy consisting of multiple email steps to send over time.

## Data model (logical)
- Cadence
  - id
  - name
  - description
  - isActive
- CadenceStep
  - cadenceId
  - stepIndex
  - delayDaysFromPrevious
  - subjectTemplate
  - bodyTemplate

- LeadCadenceEnrollment
  - leadId
  - cadenceId
  - enrolledAt
  - pausedAt (optional)
  - completedAt (optional)
  - currentStepIndex
  - nextStepDueAt
## Requirements
### Requirement: Create and edit cadences
The system SHALL allow creating and editing cadences and their steps.

#### Scenario: Create a cadence with two steps
- **WHEN** the user creates a cadence and adds two steps
- **THEN** the cadence and its steps are persisted

### Requirement: Enroll a lead
The system SHALL allow enrolling a lead into a cadence.

#### Scenario: Enroll a lead into a cadence
- **WHEN** the user enrolls a lead into a cadence
- **THEN** the enrollment is persisted

### Requirement: Next-step reminders
The system SHALL compute the next step due date (`nextStepDueAt`) for each enrolled lead.

#### Scenario: Enrollment computes a next step due date
- **WHEN** a lead is enrolled into a cadence
- **THEN** the system sets `nextStepDueAt` based on the cadence step delays

### Requirement: Manual send logging
The system SHALL allow the user to mark a step as "sent" even if emails are sent outside the app.

#### Scenario: Mark a cadence step as sent
- **WHEN** the user marks the current step as sent
- **THEN** the system advances the enrollment to the next step

### Requirement: Pause and resume
The system SHALL support pausing an enrollment.

#### Scenario: Pause an enrollment
- **WHEN** the user pauses a cadence enrollment
- **THEN** the system stops scheduling new step reminders for that enrollment

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

## Scenarios
### Scenario: Enroll lead and get next reminder
- GIVEN a cadence exists with step 0 delay 0 days and step 1 delay 3 days
- WHEN the user enrolls a lead
- THEN the system sets `nextStepDueAt` to now (or today)
- AND the system creates or surfaces a reminder for the next step

### Scenario: Mark step as sent
- GIVEN an enrolled lead with a due step
- WHEN the user marks the step as sent
- THEN the system advances `currentStepIndex`
- AND the next due date is recalculated
