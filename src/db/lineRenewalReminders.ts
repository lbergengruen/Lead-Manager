import { and, eq, gte, isNull } from "drizzle-orm";

import { companyLines, lineContracts, reminders } from "@/db/schema";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function ensureLineContractRenewalReminderCore(
  db: any,
  {
    companyId,
    lineContractId,
    contractEndDate,
    daysBeforeRenewal = 30
  }: {
    companyId: string;
    lineContractId: string;
    contractEndDate: Date;
    daysBeforeRenewal?: number;
  }
) {
  const dueAt = addDays(contractEndDate, -daysBeforeRenewal);
  const idempotencyKey = `contract:renewal:${lineContractId}:${daysBeforeRenewal}`;

  await db
    .update(reminders)
    .set({ idempotencyKey, dueAt, updatedAt: new Date() })
    .where(
      and(
        eq(reminders.lineContractId, lineContractId),
        isNull(reminders.idempotencyKey),
        eq(reminders.status, "open")
      )
    );

  await db
    .insert(reminders)
    .values({
      companyId,
      lineContractId,
      title: `Contract renewal (${daysBeforeRenewal} days)`,
      dueAt,
      idempotencyKey,
      status: "open"
    })
    .onConflictDoUpdate({
      target: reminders.idempotencyKey,
      set: {
        dueAt,
        updatedAt: new Date()
      }
    });

  return { dueAt };
}

export async function ensureLineRenewalReminders(db: any, now = new Date()) {
  const cutoff = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365);

  const rows = await db
    .select({
      contractId: lineContracts.id,
      endDate: lineContracts.endDate,
      companyId: companyLines.companyId
    })
    .from(lineContracts)
    .innerJoin(companyLines, eq(lineContracts.lineId, companyLines.id))
    .where(gte(lineContracts.endDate, cutoff));

  let ensured = 0;

  for (const r of rows) {
    await ensureLineContractRenewalReminderCore(db, {
      companyId: r.companyId,
      lineContractId: r.contractId,
      contractEndDate: r.endDate
    });

    ensured += 1;
  }

  return { ensured };
}
