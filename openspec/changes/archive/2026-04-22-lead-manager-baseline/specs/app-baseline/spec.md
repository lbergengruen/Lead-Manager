# App Baseline

## Purpose
Provide the foundational application structure, deployment, and database connectivity for the Lead Manager.

## Requirements

## ADDED Requirements

### Requirement: Authentication baseline
The system SHALL support a baseline authentication mechanism suitable for a single-user app.

#### Scenario: Access requires authentication
- **WHEN** an unauthenticated user visits the app
- **THEN** the system requires authentication before showing lead data

### Requirement: Deployment to Vercel
The system SHALL be deployable to Vercel with environment-based configuration.

#### Scenario: Configure environment variables
- **WHEN** the app is deployed to Vercel
- **THEN** configuration is provided via environment variables

### Requirement: Database connectivity
The system SHALL connect to a managed Postgres database and store all core entities.

#### Scenario: Persist lead
- **WHEN** a lead is created
- **THEN** the lead is stored in Postgres
