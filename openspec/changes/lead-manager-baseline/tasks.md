## 1. Project setup (Vercel-ready)

- [x] 1.1 Create a Next.js (App Router) + TypeScript app skeleton suitable for Vercel deployment
- [x] 1.2 Add formatting/linting defaults (ESLint) and ensure the app builds locally
- [x] 1.3 Add environment variable conventions for DB + optional Gmail integration
- [x] 1.4 Verification: deploy a hello-world build to Vercel and confirm it loads

## 2. Database and core data model

- [x] 2.1 Choose DB access layer (ORM/query builder) and set up Postgres connectivity
- [x] 2.2 Implement migrations/schema for Leads, Reminders, Cadences, CadenceSteps, Enrollments, Clients, Licenses, and EmailActivity
- [x] 2.3 Seed minimal sample data for local development
- [x] 2.4 Verification: create and query a lead record end-to-end from the app

## 3. Leads (CRUD + status + search)

- [x] 3.1 Implement Lead create/edit/delete (soft delete) and details view
- [x] 3.2 Implement leads list and search by name/company/email
- [x] 3.3 Implement lead status updates and display status in list
- [x] 3.4 Verification: create 3 leads, search, update status, and confirm persistence

## 4. Reminders (follow-ups)

- [x] 4.1 Implement reminders list views (overdue/today/upcoming)
- [x] 4.2 Implement create reminder linked to lead/license or unattached
- [x] 4.3 Implement snooze and mark-as-done flows
- [x] 4.4 Verification: create an overdue reminder and confirm it appears in the overdue view

## 5. Email cadences (strategies)

- [x] 5.1 Implement cadence CRUD (cadence + ordered steps)
- [x] 5.2 Implement enroll lead into cadence and compute first `nextStepDueAt`
- [x] 5.3 Implement "mark step as sent" to advance enrollment and recompute next due date
- [x] 5.4 Add manual outbound email logging tied to leads and cadence steps
- [x] 5.5 Verification: enroll a lead, mark step 0 sent, and confirm step 1 becomes due later

## 6. License renewals

- [ ] 6.1 Implement Client CRUD and License CRUD
- [ ] 6.2 Implement renewal reminder windows configuration (e.g., 60/30/7)
- [ ] 6.3 Implement renewal reminders generation logic (idempotent)
- [ ] 6.4 Verification: create a license renewing in 30 days and confirm a 30-day reminder exists

## 7. Scheduling (Cron) + idempotency

- [ ] 7.1 Add a scheduled job endpoint (or server-side job) to evaluate cadence enrollments and ensure next-step reminders exist
- [ ] 7.2 Add scheduled logic to evaluate licenses and ensure renewal reminders exist
- [ ] 7.3 Implement idempotency keys/constraints to prevent duplicate reminders
- [ ] 7.4 Verification: run the scheduler twice and confirm no duplicates are created

## 8. Gmail integration (optional, gated)

- [ ] 8.1 Add feature flag/config gating so the app runs without Gmail configured
- [ ] 8.2 Implement Gmail OAuth2 connect/disconnect flow (store tokens securely)
- [ ] 8.3 Implement compose UI pre-filled from cadence step templates when Gmail is enabled
- [ ] 8.4 Implement send-email flow with confirmation and outbound activity logging
- [ ] 8.5 Verification: connect Gmail in a dev environment and send a test email, confirming it is logged
