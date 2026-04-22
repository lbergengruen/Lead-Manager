# Follow-ups & Reminders

## Purpose
This domain covers tasks/reminders for contacting leads and clients.
## Requirements
### Requirement: Reminders
The system SHALL allow creating reminders tied to either:
- a lead, or
- a client contract / license, or
- a general (unattached) reminder.

Each reminder SHALL have:
- title
- dueAt
- optional link to a lead/license
- status (open, done, canceled)

#### Scenario: Reminder for lead follow-up
- **WHEN** the user creates a reminder due in 3 days linked to a lead
- **THEN** the reminder is persisted and visible as open

### Requirement: Snooze
The system SHALL allow snoozing a reminder by setting a new `dueAt`.

#### Scenario: Snooze a reminder
- **WHEN** the user snoozes a reminder to a later date
- **THEN** the reminder `dueAt` is updated

### Requirement: Overdue visibility
The system SHALL highlight overdue reminders.

#### Scenario: Overdue reminder is highlighted
- **WHEN** a reminder becomes overdue
- **THEN** the system highlights it as overdue

### Requirement: Notification delivery
The system SHALL support notifying the user when reminders are due.

#### Scenario: Due reminder triggers notification
- **WHEN** a reminder becomes due
- **THEN** the system can surface a notification to the user

### Requirement: Reminders rendered as card alerts
The system SHALL render reminders as alert icons on company cards in the Kanban board.

#### Scenario: Due reminder shows on card
- **WHEN** a company has an open reminder that is due or overdue
- **THEN** the company card displays an alert icon indicating follow-up is required

### Requirement: Proposal follow-up reminder
The system SHALL create a proposal follow-up reminder one week after the company enters the Evaluating Proposal stage.

#### Scenario: Proposal follow-up scheduled
- **WHEN** the user moves a company into Evaluating Proposal and records the proposal date
- **THEN** the system creates (or ensures existence of) a reminder due 7 days after that date

### Requirement: Trial check-in reminders
The system SHALL create trial check-in reminders every 10 days after a company enters the 30 day Trial stage.

#### Scenario: Trial check-in schedule
- **WHEN** the user moves a company into 30 day Trial and records the trial start date
- **THEN** the system creates (or ensures existence of) reminders due at day 10, day 20, and day 30 after that date

## Scenarios
### Scenario: Reminder for lead follow-up
- GIVEN a lead exists
- WHEN the user creates a reminder due in 3 days linked to the lead
- THEN the reminder appears in the reminders list
- AND the lead shows its next upcoming reminder (if any)

### Scenario: Mark reminder done
- GIVEN an open reminder
- WHEN the user marks it done
- THEN it no longer shows as open
- AND it remains visible in history views
