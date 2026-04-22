## Context

This is a greenfield, single-user commercial workflow app intended to run on Vercel free tier with a free/low-cost managed Postgres database.
The user’s core workflow is:
- capture a lead
- follow a repeatable cold email cadence
- get reminders to send the next step
- track status and history
- manage client licenses and proactively reach out before renewal

Constraints:
- Vercel-hosted Next.js app with minimal operational complexity
- Reminders must still work even if the user does not open the app daily
- Gmail integration is optional and should be safe-by-default

## Goals / Non-Goals

**Goals:**
- Provide an MVP baseline that supports:
  - CRUD leads
  - CRUD cadences and steps
  - enroll a lead into a cadence; compute next due step
  - reminders list (overdue/today/upcoming), with snooze/complete
  - licenses/contracts with renewal dates and pre-renewal reminders
  - outbound email activity logging (manual first; Gmail send later)
- Keep the data model simple and auditable (timestamps, immutable activity log).
- Make scheduling/idempotency explicit so recurring jobs don’t create duplicate reminders.

**Non-Goals:**
- Team accounts, permissions, or multi-tenant design.
- Two-way email sync (reading inbox, threading, reply classification) in the baseline.
- Fully automated sending of cadence emails without user interaction.

## Decisions

- Data storage: Postgres for core entities (leads, cadences, enrollments, reminders, clients/licenses, email activity).
  - Rationale: works well with Vercel-hosted apps; supports relational constraints and queries.

- App architecture: Next.js App Router + TypeScript.
  - Server actions/route handlers handle CRUD.
  - Rationale: Vercel-native deployment and a single codebase.

- Reminder generation: scheduled job (Vercel Cron) runs at a fixed interval (e.g., hourly/daily) to:
  - evaluate cadence enrollments and create/update next-step reminders
  - evaluate license renewals and create/update renewal reminders
  - enforce idempotency via uniqueness keys (e.g., (leadId, cadenceId, stepIndex, dueDate) for cadence reminders; (licenseId, windowDays) for renewal reminders)
  - Rationale: ensures reminders exist even without user sessions.

- Cadence execution model: “enrollment” stores current step index and next due time.
  - Marking a step as sent advances the index and recomputes `nextStepDueAt`.
  - Rationale: minimal state; easy to debug.

- Email activity logging: first iteration supports manual logging (“sent outside app”).
  - Gmail integration, when added, uses OAuth2 tokens stored server-side.
  - Rationale: deliver value without immediate OAuth complexity; keep Gmail optional.

- Gmail integration baseline: support OAuth + compose/send + log.
  - Rationale: useful but has higher setup friction; keep behind a feature flag/config.

## Risks / Trade-offs

- Scheduling limits on free tiers → Mitigation: keep jobs simple, idempotent, and run at low frequency; allow manual “Refresh reminders” trigger.
- Gmail OAuth complexity and token security → Mitigation: implement later behind a capability boundary; never store raw credentials; encrypt tokens; limit scopes.
- Product scope creep (CRM features) → Mitigation: keep MVP centered on reminders + cadences + renewals.
