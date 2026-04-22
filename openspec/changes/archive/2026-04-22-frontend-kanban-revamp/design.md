## Context

The current Lead Manager UI is implemented as simple list/detail pages (Leads, Cadences, Licenses, Reminders) with minimal styling. While functional, it does not fit the primary daily workflow: managing companies through an outreach pipeline, surfacing next actions directly on the main screen, and recording key stage events (proposal sent, trial check-ins, contract renewals).

Constraints:
- App is deployed to Vercel and uses Postgres + Drizzle.
- Prefer minimal operational complexity (no separate backend).
- UI should remain minimalist but feel polished.
- Gmail integration exists but is explicitly out-of-scope for this change (we will not depend on it).

## Goals / Non-Goals

**Goals:**
- Provide a single primary interface: a Kanban board where each company is a draggable card.
- Model outreach as a company pipeline with stages:
  - Dead Leads
  - Contacted
  - Evaluating Proposal
  - 30 day Trial
  - Client
- Use modal dialogs as the primary “details view” for:
  - company + contacts
  - strategy assignment and strategy editing
  - line/contract management and invoice tracking
- Make reminders/actions visible as icons on cards (due outreach, missing invoice, contract renewal upcoming).
- Introduce a Strategy builder UI (ordered emails + per-email day offsets) with an editing modal.
- Maintain idempotent reminder generation (stage-driven reminders + contract renewals) to support scheduled evaluation.
- Improve visual design using a small, standard UI stack (components + icons + styling + DnD).

**Non-Goals:**
- Implementing Gmail OAuth/send flow or deep email threading.
- Multi-user / auth overhaul.
- Perfect historical migration of all existing lead/license data (we will provide a pragmatic backfill and allow manual cleanup).

## Decisions

### UI stack
- **Decision**: Adopt TailwindCSS for styling and shadcn/ui (Radix primitives) for consistent accessible components.
  - **Rationale**: Minimalist, consistent UI with low design effort; easy to compose with Next.js App Router.
  - **Alternatives considered**:
    - MUI: heavier look/feel, less minimalist by default.
    - Chakra: good DX, but shadcn/Radix is closer to “minimalist + control”.

- **Decision**: Use Lucide icons.
  - **Rationale**: High-quality icon set, good with shadcn.

- **Decision**: Use a modern drag-and-drop library for the board (e.g. dnd-kit).
  - **Rationale**: Maintained, accessible-ish, flexible for Kanban.

### Page structure and navigation
- **Decision**: Replace the app’s primary navigation with:
  - `/board` (or `/`): Leads & Clients Kanban board
  - `/strategies`: strategies list + modal editor
  - `/settings`

Legacy pages can remain temporarily behind links during migration but should not be the primary workflow.

### Data model refactor (company-centric)
- **Decision**: Introduce a first-class `companies` table and migrate existing data into it.
  - Company is the “card” entity.
  - Contacts become a child entity (`company_contacts`).
  - Existing `leads` become a source for backfill; we can preserve them during transition.

- **Decision**: Introduce `strategies` + `strategy_emails`.
  - A Strategy is an ordered list of templates.
  - Each email has a `dayOffset` from assignment (or from previous email) to compute “next due”.

- **Decision**: Introduce `lines` (products) and `line_contracts` (contract terms) tied to companies.
  - Each line has its own contract window and monthly price.
  - Invoicing is tracked with a boolean or enum per line (e.g. `invoicedThroughMonth` later).

### Workflow automation and reminders
- **Decision**: Model “alerts” as reminders (existing `reminders` table) plus derived UI state.
  - Use `idempotencyKey` to guarantee no duplicates.
  - Store stage-specific reminders with stable keys:
    - `stage:proposal-followup:<companyId>:<proposalDate>`
    - `stage:trial-checkin:<companyId>:<trialStartDate>:<n>`
    - `contract:renewal:<lineContractId>:<days>`

- **Decision**: Keep reminder generation in server-side functions callable by:
  - Stage transition server actions
  - Scheduled job endpoint (`/api/cron/scheduler`)

### Stage transitions
- **Decision**: Explicitly capture stage events in a `company_stage_events` table.
  - Examples:
    - `contactedAt`, with chosen `strategyId`
    - `proposalSentAt`
    - `trialStartedAt`
    - `becameClientAt`
  - Rationale: stage transitions require dates and drive reminder generation.

## Risks / Trade-offs

- **[Risk] Large refactor touches many parts of the app** → Mitigation: implement in phases; keep legacy pages temporarily; ship the board MVP first.
- **[Risk] Data migration/backfill may be imperfect** → Mitigation: one-time backfill script; allow manual edits in modal; keep original `leads/clients/licenses` tables for a transition period.
- **[Risk] Drag-and-drop UX edge cases** (mobile, scroll containers) → Mitigation: choose a mature DnD library; keep columns simple; add keyboard move as later enhancement.
- **[Risk] Reminder logic becomes complex** → Mitigation: centralize reminder generation; require idempotency keys; add verification scripts that run scheduler twice.
- **[Risk] Invoice tracking requirements grow** → Mitigation: start with simple per-line “invoiced” status and card icon; evolve later.

## Migration Plan

1. Add new tables: companies, contacts, strategies, strategy_emails, lines/contracts, stage events.
2. Backfill:
   - Create companies from existing leads (group by `company` or fallback to lead name).
   - Create a default contact from lead primary email/phone.
   - Create lines/contracts from existing licenses (one line per license).
3. Ship board MVP:
   - Columns + drag/drop stage updates.
   - Modal view/edit basic company + contacts.
4. Add strategy assignment + due-step alerts.
5. Add proposal/trial/client stage-specific reminder rules.
6. Add line contracts + invoice flags + card icons.
7. Remove or de-emphasize legacy pages once parity is reached.

## Open Questions

- Should stages be stored as an enum on company or computed from most recent stage event?
- Strategy cadence: should each email be defined as “Day N since assignment” or “Delay days from previous”? (MVP: Day since assignment.)
- How should we represent “Dead Leads” (terminal) vs “Lost” (deal lost) semantics?
- Should invoice status be per-line boolean or “missing invoices” derived from contract months? (MVP: boolean.)
- Should reminders on cards be limited to next due only, or show multiple badges? (MVP: show up to 2-3 icons + count.)
