## ADDED Requirements

### Requirement: Cadence templates and steps
The system SHALL allow defining a cadence with ordered steps including `delayDaysFromPrevious`, `subjectTemplate`, and `bodyTemplate`.

#### Scenario: Create a cadence with steps
- **WHEN** the user creates a cadence with two steps
- **THEN** the system persists the cadence and its steps in order

### Requirement: Enroll a lead in a cadence
The system SHALL allow enrolling a lead in a cadence and computing the first due step.

#### Scenario: Enrollment sets first due step
- **WHEN** the user enrolls a lead into a cadence
- **THEN** the system sets the enrollment current step to the first step
- **AND** sets `nextStepDueAt` according to the cadence rules

### Requirement: Mark cadence step as sent
The system SHALL allow marking the currently due cadence step as sent and advance to the next step.

#### Scenario: Sending advances to next step
- **WHEN** the user marks the due step as sent
- **THEN** the system advances the enrollment to the next step
- **AND** recalculates `nextStepDueAt`
