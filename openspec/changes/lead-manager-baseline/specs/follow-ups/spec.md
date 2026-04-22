## ADDED Requirements

### Requirement: Reminder list views
The system SHALL provide views for reminders grouped by status and due time (overdue, today, upcoming).

#### Scenario: Overdue reminders are visible
- **WHEN** a reminder’s `dueAt` is in the past and the reminder is `open`
- **THEN** it appears in the overdue reminders view

### Requirement: Reminder completion
The system SHALL allow marking a reminder as `done`.

#### Scenario: Mark reminder done
- **WHEN** the user marks an open reminder as done
- **THEN** the reminder status becomes `done`
