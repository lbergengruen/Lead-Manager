# Email Cadences (Strategies)

## Overview
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

### Requirement: Enroll a lead
The system SHALL allow enrolling a lead into a cadence.

### Requirement: Next-step reminders
The system SHALL compute the next step due date (`nextStepDueAt`) for each enrolled lead.

### Requirement: Manual send logging
The system SHALL allow the user to mark a step as "sent" even if emails are sent outside the app.

### Requirement: Pause and resume
The system SHOULD support pausing an enrollment.

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
