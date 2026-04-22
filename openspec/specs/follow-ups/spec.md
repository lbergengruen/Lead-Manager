# Follow-ups & Reminders

## Overview
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

### Requirement: Snooze
The system SHALL allow snoozing a reminder by setting a new `dueAt`.

### Requirement: Overdue visibility
The system SHALL highlight overdue reminders.

### Requirement: Notification delivery
The system SHOULD support notifying the user when reminders are due.

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
