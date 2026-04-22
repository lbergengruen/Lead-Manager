## Purpose
This spec defines reminders as card-level alerts on the company board and adds stage-driven follow-up reminder rules.

## Requirements

## MODIFIED Requirements

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
