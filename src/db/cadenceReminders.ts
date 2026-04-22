import { and, eq, isNull, lt } from "drizzle-orm";

import {
  cadenceSteps,
  leadCadenceEnrollments,
  reminders,
  leads
} from "@/db/schema";

export async function ensureCadenceStepReminders(db: any, now = new Date()) {
  const enrollments = await db
    .select({
      id: leadCadenceEnrollments.id,
      leadId: leadCadenceEnrollments.leadId,
      cadenceId: leadCadenceEnrollments.cadenceId,
      currentStepIndex: leadCadenceEnrollments.currentStepIndex,
      nextStepDueAt: leadCadenceEnrollments.nextStepDueAt,
      completedAt: leadCadenceEnrollments.completedAt
    })
    .from(leadCadenceEnrollments)
    .where(isNull(leadCadenceEnrollments.completedAt));

  let created = 0;

  for (const e of enrollments) {
    if (!e.nextStepDueAt) continue;

    const step = await db
      .select({
        id: cadenceSteps.id,
        subjectTemplate: cadenceSteps.subjectTemplate
      })
      .from(cadenceSteps)
      .where(
        and(
          eq(cadenceSteps.cadenceId, e.cadenceId),
          eq(cadenceSteps.stepIndex, e.currentStepIndex)
        )
      )
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!step) continue;

    const lead = await db
      .select({
        name: leads.name,
        company: leads.company
      })
      .from(leads)
      .where(eq(leads.id, e.leadId))
      .limit(1)
      .then((r: any[]) => r[0]);

    const who = lead?.name ?? lead?.company ?? "lead";
    const title = `Cadence step ${e.currentStepIndex}: ${who}`;
    const idempotencyKey = `cadence:${e.id}:${e.currentStepIndex}`;

    const existing = await db
      .select({ id: reminders.id })
      .from(reminders)
      .where(eq(reminders.idempotencyKey, idempotencyKey))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (existing) continue;

    await db.insert(reminders).values({
      title,
      dueAt: e.nextStepDueAt,
      leadId: e.leadId,
      idempotencyKey,
      status: "open"
    });

    created += 1;
  }

  // Optional: auto-close cadence reminders that are overdue but the enrollment has moved on.
  // We keep it minimal for baseline: no cleanup.

  return { created };
}
