import { and, eq } from "drizzle-orm";

import { clients, licenses, reminders, renewalReminderWindows } from "@/db/schema";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function setRenewalReminderWindows(db: any, days: number[]) {
  const normalized = Array.from(
    new Set(
      days
        .map((d) => Math.trunc(d))
        .filter((d) => Number.isFinite(d) && d > 0)
    )
  ).sort((a, b) => b - a);

  await db.delete(renewalReminderWindows);

  if (normalized.length === 0) {
    return { windows: [] as number[] };
  }

  await db.insert(renewalReminderWindows).values(
    normalized.map((d) => ({
      daysBeforeRenewal: d
    }))
  );

  return { windows: normalized };
}

export async function getRenewalReminderWindows(db: any) {
  const rows = await db
    .select({ days: renewalReminderWindows.daysBeforeRenewal })
    .from(renewalReminderWindows);

  const days = rows.map((r: any) => r.days).sort((a: number, b: number) => b - a);
  return days;
}

export async function ensureRenewalReminders(db: any, now = new Date()) {
  let windows = await getRenewalReminderWindows(db);
  if (windows.length === 0) {
    windows = [60, 30, 7];
    await setRenewalReminderWindows(db, windows);
  }

  const licenseRows = await db
    .select({
      id: licenses.id,
      clientName: clients.name,
      productName: licenses.productName,
      renewalDate: licenses.renewalDate,
      status: licenses.status
    })
    .from(licenses)
    .innerJoin(clients, eq(licenses.clientId, clients.id))
    .where(eq(licenses.status, "active"));

  let created = 0;

  for (const lic of licenseRows) {
    if (!lic.renewalDate) continue;

    for (const days of windows) {
      const dueAt = addDays(lic.renewalDate, -days);
      const title = `Renewal outreach (${days} days)`;
      const idempotencyKey = `renewal:${lic.id}:${days}`;

      const existing = await db
        .select({ id: reminders.id })
        .from(reminders)
        .where(
          and(
            eq(reminders.licenseId, lic.id),
            eq(reminders.idempotencyKey, idempotencyKey)
          )
        )
        .limit(1)
        .then((r: any[]) => r[0]);

      if (existing) continue;

      await db.insert(reminders).values({
        title,
        dueAt,
        licenseId: lic.id,
        idempotencyKey,
        status: "open"
      });

      created += 1;
    }
  }

  return { created, windowsUsed: windows };
}
