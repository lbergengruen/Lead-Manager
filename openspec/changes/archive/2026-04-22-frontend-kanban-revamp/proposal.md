## Why

The current UI is functional but too barebones for daily CRM-style use and does not match the workflow of managing companies through outreach → proposal → trial → client renewal.

## What Changes

- Replace the current list/detail pages with a **single primary Kanban board** (“Leads & Clients”) where each **company** is represented by a draggable card.
- Add a **company details modal** (popup) that becomes the main place to view/edit company data (contacts, licenses/lines, notes, activity, reminders).
- Introduce a **Strategy** concept (series of email templates with cadence) and a **Strategies** page to create/edit strategies in a modal.
- Add workflow-driven automation on stage transitions:
  - Moving to **Contacted** requires choosing a Strategy.
  - Moving to **Evaluating Proposal** captures a date and creates a follow-up alert 7 days later.
  - Moving to **30 day Trial** creates check-in alerts every 10 days.
  - Moving to **Client** requires defining one or more **Lines** (products) with contract dates + monthly price, invoice status, and produces renewal alerts 1 month before contract end.
- Reminders become **icons/alerts on cards** (instead of a separate reminders-centric experience).
- UI/UX polish while keeping a minimalist aesthetic, by adopting a small set of UI + interaction libraries (e.g. accessible components + drag-and-drop).

Non-goals (for now):
- Gmail integration and sending email directly from the app.

## Capabilities

### New Capabilities
- `companies-board`: A company-centric Kanban board UI with stage transitions and modal-based company management.
- `strategies`: Manage outreach strategies as ordered email templates with per-email cadence.
- `lines-contracts`: Manage client lines/products with contracts, invoice tracking, and contract renewal alerts.

### Modified Capabilities
- `leads`: Shift from person/lead-centric screens to company-centric cards and multi-contact management.
- `email-cadences`: Reframe from "cadence" enrollment to "strategy" assignment and due-step alerts surfaced on cards.
- `follow-ups`: Surface reminders as card alerts and create stage-driven follow-up reminders (proposal follow-up, trial check-ins).
- `license-renewals`: Extend from a single license to multiple client lines/contracts per client and show renewal alerts on cards.

## Impact

- **Frontend**:
  - New Kanban board page and modal workflows.
  - New Strategies page and modal editor.
  - Replace/retire current navigation structure.
  - Add UI component library + styling system (e.g. Tailwind + Radix/shadcn) and drag-and-drop.
- **Database**:
  - Likely new first-class entities: Company, Contact, Strategy, StrategyEmail, Line/Contract, Invoice status.
  - Data migration/backfill from existing `leads`/`clients`/`licenses` into the new company model.
- **Scheduling / Reminders**:
  - Additional reminder generation rules driven by stage transitions (proposal follow-up, trial check-ins, contract renewals).
