## Purpose
This spec defines the company-centric Kanban board as the primary UI and the alerts surfaced on cards.

## Requirements

## MODIFIED Requirements

### Requirement: Company Kanban board as primary UI
The system SHALL provide a Kanban-style board as the main interface where each company is represented by a card.

#### Scenario: Board shows companies grouped by stage
- **WHEN** the user opens the board
- **THEN** the system shows columns for Dead Leads, Contacted, Evaluating Proposal, 30 day Trial, and Client
- **AND** each company appears as a card in exactly one column

### Requirement: Drag-and-drop stage transitions
The system SHALL allow moving a company card between columns to update its stage.

#### Scenario: Moving a card updates stage
- **WHEN** the user drags a company card from Contacted to Evaluating Proposal
- **THEN** the system persists the company's new stage
- **AND** the card appears in the destination column after refresh

### Requirement: Company details modal
The system SHALL show a company details modal when the user clicks a card.

#### Scenario: Open company modal
- **WHEN** the user clicks a company card
- **THEN** the system opens a modal showing company details, contacts, strategy status, reminders, and lines/contracts

### Requirement: Card alert icons
The system SHALL surface due follow-ups and operational issues as icons on the company card.

#### Scenario: Card shows due follow-up
- **WHEN** a company has an open reminder that is due now or overdue
- **THEN** the card displays a follow-up alert icon

#### Scenario: Card shows missing invoice indicator
- **WHEN** a company has one or more client lines marked as not invoiced
- **THEN** the card displays an invoice alert icon

#### Scenario: Card shows renewal alert
- **WHEN** a company has a due or overdue renewal reminder for any of its Lines
- **THEN** the card displays a contract renewal alert icon
