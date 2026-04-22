import { and, asc, eq, gte } from "drizzle-orm";

import { getDb } from "@/db";
import {
  companies,
  companyStrategyAssignments,
  companyContacts,
  companyLines,
  lineContracts,
  reminders,
  strategies
} from "@/db/schema";

import { BoardClient, type CompanyCard } from "@/app/board/BoardClient";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const db = getDb();

  const now = new Date();

  const companyRows = await db
    .select({
      id: companies.id,
      name: companies.name,
      notes: companies.notes,
      stage: companies.stage
    })
    .from(companies)
    .orderBy(asc(companies.name))
    .limit(500);

  const contacts = await db
    .select({
      id: companyContacts.id,
      companyId: companyContacts.companyId,
      name: companyContacts.name,
      email: companyContacts.email,
      phone: companyContacts.phone,
      role: companyContacts.role,
      isPrimary: companyContacts.isPrimary
    })
    .from(companyContacts)
    .orderBy(asc(companyContacts.createdAt))
    .limit(2000);

  const lines = await db
    .select({
      id: companyLines.id,
      companyId: companyLines.companyId,
      name: companyLines.name,
      isInvoiced: companyLines.isInvoiced
    })
    .from(companyLines)
    .orderBy(asc(companyLines.createdAt))
    .limit(2000);

  const contracts = await db
    .select({
      id: lineContracts.id,
      lineId: lineContracts.lineId,
      startDate: lineContracts.startDate,
      endDate: lineContracts.endDate,
      pricePerMonthCents: lineContracts.pricePerMonthCents
    })
    .from(lineContracts)
    .orderBy(asc(lineContracts.createdAt))
    .limit(4000);

  const strategyRows = await db
    .select({
      id: strategies.id,
      name: strategies.name
    })
    .from(strategies)
    .orderBy(asc(strategies.name))
    .limit(500);

  const assignments = await db
    .select({
      companyId: companyStrategyAssignments.companyId,
      strategyId: companyStrategyAssignments.strategyId,
      nextOutreachDueAt: companyStrategyAssignments.nextOutreachDueAt
    })
    .from(companyStrategyAssignments)
    .limit(2000);

  const dueReminders = await db
    .select({
      id: reminders.id,
      companyId: reminders.companyId,
      dueAt: reminders.dueAt,
      idempotencyKey: reminders.idempotencyKey
    })
    .from(reminders)
    .where(
      and(
        eq(reminders.status, "open"),
        gte(reminders.dueAt, new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3650))
      )
    )
    .limit(5000);

  const contactsByCompany = new Map<string, typeof contacts>();
  for (const c of contacts) {
    const arr = contactsByCompany.get(c.companyId) ?? [];
    arr.push(c);
    contactsByCompany.set(c.companyId, arr);
  }

  const contractsByLine = new Map<string, typeof contracts>();
  for (const c of contracts) {
    const arr = contractsByLine.get(c.lineId) ?? [];
    arr.push(c);
    contractsByLine.set(c.lineId, arr);
  }

  const linesByCompany = new Map<string, typeof lines>();
  for (const l of lines) {
    const arr = linesByCompany.get(l.companyId) ?? [];
    arr.push(l);
    linesByCompany.set(l.companyId, arr);
  }

  const initialCompanies: CompanyCard[] = companyRows.map((co) => {
    const coContacts = contactsByCompany.get(co.id) ?? [];
    const coLines = linesByCompany.get(co.id) ?? [];

    return {
      id: co.id,
      name: co.name,
      notes: co.notes,
      stage: co.stage as any,
      nextOutreachDueAt: null,
      hasDueOutreach: false,
      hasDueReminder: false,
      hasDueRenewal: false,
      strategyAssigned: null,
      contacts: coContacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: c.role,
        isPrimary: c.isPrimary
      })),
      lines: coLines.map((l) => ({
        id: l.id,
        name: l.name,
        isInvoiced: l.isInvoiced,
        contracts: (contractsByLine.get(l.id) ?? []).map((ct) => ({
          id: ct.id,
          startDate: ct.startDate.toISOString(),
          endDate: ct.endDate.toISOString(),
          pricePerMonthCents: ct.pricePerMonthCents
        }))
      }))
    };
  });

  const assignmentByCompany = new Map<string, { strategyId: string; nextOutreachDueAt: Date | null }>();
  for (const a of assignments) {
    assignmentByCompany.set(a.companyId, { strategyId: a.strategyId, nextOutreachDueAt: a.nextOutreachDueAt ?? null });
  }

  const dueReminderByCompany = new Map<string, boolean>();
  const dueRenewalByCompany = new Map<string, boolean>();
  for (const r of dueReminders) {
    if (!r.companyId) continue;
    if (r.dueAt <= now) {
      const key = r.idempotencyKey ? String(r.idempotencyKey) : "";
      if (key.startsWith("contract:renewal:")) {
        dueRenewalByCompany.set(r.companyId, true);
      } else {
        dueReminderByCompany.set(r.companyId, true);
      }
    }
  }

  const strategyNameById = new Map<string, string>();
  for (const s of strategyRows) {
    strategyNameById.set(s.id, s.name);
  }

  for (const c of initialCompanies) {
    const a = assignmentByCompany.get(c.id);
    if (a) {
      c.nextOutreachDueAt = a.nextOutreachDueAt ? a.nextOutreachDueAt.toISOString() : null;
      c.hasDueOutreach = a.nextOutreachDueAt ? a.nextOutreachDueAt <= now : false;
      c.strategyAssigned = { id: a.strategyId, name: strategyNameById.get(a.strategyId) ?? a.strategyId };
    }
    c.hasDueReminder = dueReminderByCompany.get(c.id) ?? false;
    c.hasDueRenewal = dueRenewalByCompany.get(c.id) ?? false;
  }

  return <BoardClient initialCompanies={initialCompanies} strategies={strategyRows} />;
}
