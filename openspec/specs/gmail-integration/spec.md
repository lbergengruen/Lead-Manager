# Gmail Integration

## Overview
Optionally connect Gmail to send emails and record outbound activity directly from the app.

## Requirements
### Requirement: OAuth connection
The system SHALL support connecting a Gmail account via OAuth2.

### Requirement: Permissions
The system SHALL request the minimum required permissions for:
- sending emails
- reading message metadata needed to link sent emails to leads (if implemented)

### Requirement: Sending email
The system SHOULD allow sending an email to a lead from within the app.

### Requirement: Activity logging
The system SHALL log outbound email activity against the associated lead.

### Requirement: Safety
The system SHALL provide a confirmation step before sending email.

## Scenarios
### Scenario: Connect Gmail
- GIVEN the user chooses to connect Gmail
- WHEN the user completes OAuth2 authorization
- THEN the system stores the authorization securely
- AND the user can send emails from the app

### Scenario: Send a cadence step via Gmail
- GIVEN a lead is enrolled in a cadence and a step is due
- WHEN the user chooses "Send via Gmail"
- THEN the system opens an email composer populated from the cadence templates
- AND when sent, the step is marked sent and logged
