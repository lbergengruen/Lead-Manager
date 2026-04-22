## 1. UI foundation + visual refresh

- [x] 1.1 Add TailwindCSS and base styling (minimalist theme)
- [x] 1.2 Add component primitives (shadcn/ui or equivalent) and icon set
- [x] 1.3 Update app shell/navigation to Board / Strategies / Settings
- [x] 1.4 Verification: build runs and core pages render with new styling

## 2. Data model: company-centric entities

- [x] 2.1 Add DB tables for companies and contacts (company card entity + contact management)
- [x] 2.2 Add DB tables for strategies and strategy emails (ordered emails with day offsets)
- [x] 2.3 Add DB tables for lines/contracts and invoice status
- [x] 2.4 Add DB tables for company stage and stage events (dates + metadata)
- [x] 2.5 Add migrations and regenerate Drizzle types

## 3. Backfill + migration helpers

- [x] 3.1 Implement backfill script: create companies/contacts from existing leads
- [x] 3.2 Implement backfill script: create lines/contracts from existing licenses
- [x] 3.3 Verification: seed/backfill produces at least 5 companies with cards on board

## 4. Board (Leads & Clients) MVP

- [x] 4.1 Implement `/board` page that loads companies grouped into the 5 stages
- [x] 4.2 Implement company card UI with basic info (name + stage)
- [x] 4.3 Add drag-and-drop between columns and persist stage changes
- [x] 4.4 Implement company details modal (read-only: company + contacts + lines)
- [x] 4.5 Verification: drag a card across columns and confirm persistence after refresh

## 5. Company modal: edit + contacts management

- [x] 5.1 Add edit fields for company basics (name, notes)
- [x] 5.2 Add CRUD for contacts inside the modal
- [x] 5.3 Verification: add/edit/delete a contact and confirm persistence

## 6. Strategies page + editor modal

- [x] 6.1 Implement `/strategies` page listing strategies
- [x] 6.2 Implement strategy modal for create/edit
- [x] 6.3 Implement ordered list of strategy emails (Email #N, Day offset)
- [x] 6.4 Implement add/edit/delete of strategy emails
- [x] 6.5 Verification: create a strategy with 3 emails and reopen to confirm order/contents

## 7. Stage workflows + reminders surfaced on cards

- [x] 7.1 Moving Dead Leads -> Contacted requires selecting a Strategy
- [x] 7.2 Compute next outreach due date from strategy assignment and surface an alert icon
- [x] 7.3 In company modal, allow recording “re-contacted” with a date to acknowledge/clear the due alert
- [x] 7.4 Moving Contacted -> Evaluating Proposal prompts for proposal date and schedules a 7-day follow-up reminder
- [x] 7.5 Moving Evaluating Proposal -> 30 day Trial prompts for trial start date and schedules reminders at day 10/20/30
- [x] 7.6 Verification: move a card through stages and confirm the correct reminders appear as card alert icons

## 8. Client lines/contracts + renewal and invoice alerts

- [x] 8.1 Moving -> Client requires adding at least one Line with contract start/end and monthly price
- [x] 8.2 Generate/ensure renewal reminders 30 days before each line contract end date (idempotent)
- [x] 8.3 Add invoice status per line and show invoice icon on card until all lines are invoiced
- [x] 8.4 Verification: create a client with 2 lines, mark one uninvoiced, and confirm invoice icon behavior

## 9. Scheduling alignment

- [x] 9.1 Update scheduler logic to also ensure stage-driven reminders and line renewal reminders
- [x] 9.2 Verification: run scheduler twice and confirm no duplicate reminders are created
