import { and, desc, eq, isNull } from "drizzle-orm";

import {
  clients,
  companies,
  companyContacts,
  companyLines,
  leads,
  licenses,
  lineContracts
} from "@/db/schema";

function mapLeadStatusToStage(status: string) {
  switch (status) {
    case "contacted":
      return "contacted" as const;
    case "won":
      return "client" as const;
    case "lost":
      return "dead-lead" as const;
    case "awaiting-reply":
    case "follow-up-needed":
    case "in-discussion":
      return "evaluating-proposal" as const;
    case "new":
    default:
      return "dead-lead" as const;
  }
}

async function getOrCreateCompanyIdByName(db: any, name: string, stage: any) {
  const existing = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.name, name))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (existing) return existing.id;

  const inserted = await db
    .insert(companies)
    .values({
      name,
      stage
    })
    .returning({ id: companies.id });

  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create company");
  return id;
}

export async function backfillCompaniesAndContactsCore(db: any) {
  const leadRows = await db
    .select({
      id: leads.id,
      name: leads.name,
      company: leads.company,
      primaryEmail: leads.primaryEmail,
      phone: leads.phone,
      status: leads.status
    })
    .from(leads)
    .where(isNull(leads.deletedAt))
    .orderBy(desc(leads.createdAt));

  let companiesCreatedOrEnsured = 0;
  let contactsCreatedOrEnsured = 0;

  for (const l of leadRows) {
    const companyName = (l.company ?? l.name ?? "").trim();
    if (!companyName) continue;

    const stage = mapLeadStatusToStage(l.status);
    const companyId = await getOrCreateCompanyIdByName(db, companyName, stage);
    companiesCreatedOrEnsured += 1;

    const hasContact = Boolean(l.primaryEmail) || Boolean(l.phone) || Boolean(l.name);
    if (!hasContact) continue;

    const contactEmail = l.primaryEmail?.trim() || null;

    const existingContact = contactEmail
      ? await db
          .select({ id: companyContacts.id })
          .from(companyContacts)
          .where(and(eq(companyContacts.companyId, companyId), eq(companyContacts.email, contactEmail)))
          .limit(1)
          .then((r: any[]) => r[0])
      : null;

    if (existingContact) continue;

    await db.insert(companyContacts).values({
      companyId,
      name: l.name,
      email: contactEmail,
      phone: l.phone,
      isPrimary: true
    });

    contactsCreatedOrEnsured += 1;
  }

  return { companiesCreatedOrEnsured, contactsCreatedOrEnsured };
}

export async function backfillLinesAndContractsCore(db: any) {
  const licenseRows = await db
    .select({
      id: licenses.id,
      productName: licenses.productName,
      startDate: licenses.startDate,
      renewalDate: licenses.renewalDate,
      clientName: clients.name
    })
    .from(licenses)
    .innerJoin(clients, eq(licenses.clientId, clients.id))
    .orderBy(desc(licenses.renewalDate));

  let linesCreatedOrEnsured = 0;
  let contractsCreatedOrEnsured = 0;

  for (const lic of licenseRows) {
    const companyName = (lic.clientName ?? "").trim();
    if (!companyName) continue;

    const companyId = await getOrCreateCompanyIdByName(db, companyName, "client");

    const existingLine = await db
      .select({ id: companyLines.id })
      .from(companyLines)
      .where(and(eq(companyLines.companyId, companyId), eq(companyLines.name, lic.productName)))
      .limit(1)
      .then((r: any[]) => r[0]);

    const lineId = existingLine
      ? existingLine.id
      : await db
          .insert(companyLines)
          .values({
            companyId,
            name: lic.productName,
            isInvoiced: false
          })
          .returning({ id: companyLines.id })
          .then((r: any[]) => {
            const id = r[0]?.id;
            if (!id) throw new Error("Failed to create line");
            return id;
          });

    linesCreatedOrEnsured += 1;

    const existingContract = await db
      .select({ id: lineContracts.id })
      .from(lineContracts)
      .where(and(eq(lineContracts.lineId, lineId), eq(lineContracts.endDate, lic.renewalDate)))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (existingContract) continue;

    await db.insert(lineContracts).values({
      lineId,
      startDate: lic.startDate,
      endDate: lic.renewalDate,
      pricePerMonthCents: 0
    });

    contractsCreatedOrEnsured += 1;
  }

  return { linesCreatedOrEnsured, contractsCreatedOrEnsured };
}

export async function runBackfillAllCore(db: any) {
  const a = await backfillCompaniesAndContactsCore(db);
  const b = await backfillLinesAndContractsCore(db);
  return { ...a, ...b };
}
