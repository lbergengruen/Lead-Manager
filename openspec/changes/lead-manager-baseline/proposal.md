## Why

Today, lead outreach, follow-ups, and renewal tracking are handled manually across inboxes and ad-hoc notes, which makes it easy to miss follow-ups and renewal windows.
This change creates an initial baseline for a single-user Lead Manager app to centralize leads, outreach cadences, and renewal reminders.

## What Changes

- Add a minimal web app baseline to manage leads and their outreach lifecycle.
- Add reminders for:
  - lead follow-ups / cadence steps
  - license renewal outreach windows
- Add email cadence templates (“strategies”) and the ability to enroll a lead into a cadence and track next-step due.
- Provide an optional Gmail integration path (OAuth + send + log) with a safe first iteration.

Non-goals for this baseline:
- Multi-user/team collaboration.
- Full CRM features (pipelines, forecasting, invoicing).
- Automated email sending without explicit user confirmation.

## Capabilities

### New Capabilities
- `app-baseline`: Baseline app scaffolding for Vercel deployment, authentication, and database connectivity.
- `leads`: Store, manage, and search leads; track basic status and last/next contact.
- `follow-ups`: Create/snooze/complete reminders for outreach and renewal-related tasks.
- `email-cadences`: Define cadence templates, enroll leads, compute next steps, and log sent steps.
- `license-renewals`: Store licenses/contracts and generate renewal outreach reminders.
- `gmail-integration`: Connect Gmail via OAuth2, compose/send emails, and log outbound activity.

### Modified Capabilities
- (none)

## Impact

- New app codebase (target: Next.js + TypeScript) suitable for Vercel deployment.
- New Postgres-backed data model for leads, reminders, cadences/enrollments, clients/licenses, and email activity.
- Background scheduling for reminders (Vercel Cron or equivalent).
- Optional Google OAuth2 configuration and secure credential/token storage.
- Potential data backfill/migration: none (greenfield).
