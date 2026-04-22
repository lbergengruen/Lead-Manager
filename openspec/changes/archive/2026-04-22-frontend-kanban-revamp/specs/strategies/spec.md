## Purpose
This spec defines Strategies for outreach as ordered email templates with day offsets.

## Requirements

## ADDED Requirements

### Requirement: Strategy list
The system SHALL provide a Strategies page listing all previously defined strategies.

#### Scenario: Strategies page shows list
- **WHEN** the user opens the Strategies page
- **THEN** the system shows a list of strategies with name and last updated time

### Requirement: Strategy editor modal
The system SHALL allow creating and editing a strategy in a modal.

#### Scenario: Open strategy editor
- **WHEN** the user clicks a strategy from the list
- **THEN** the system opens a scrollable modal showing the ordered strategy emails

### Requirement: Strategy emails have day offsets
The system SHALL model a strategy as an ordered list of emails where each email has a day offset and a template.

#### Scenario: Add an email step
- **WHEN** the user adds a new email step to a strategy
- **THEN** the system prompts for the day offset and email contents
- **AND** persists the new step in the correct order

### Requirement: Edit email template contents
The system SHALL allow editing the subject and body template for each email step.

#### Scenario: Edit strategy email contents
- **WHEN** the user edits the subject/body for Email #2
- **THEN** the system saves the new template contents
- **AND** the updated contents are shown when reopening the strategy
