import { and, eq, gte, or } from "drizzle-orm";

import { companyStageEvents, companyStrategyAssignments, reminders, strategyEmails } from "@/db/schema";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function assignStrategyToCompanyCore(
  db: any,
  {
    companyId,
    strategyId,
    assignedAt
  }: {
    companyId: string;
    strategyId: string;
    assignedAt: Date;
  }
) {
  const first = await db
    .select({ dayOffset: strategyEmails.dayOffset })
    .from(strategyEmails)
    .where(and(eq(strategyEmails.strategyId, strategyId), eq(strategyEmails.stepIndex, 0)))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!first) {
    throw new Error("Strategy must have email step 0");
  }

  const nextOutreachDueAt = addDays(assignedAt, first.dayOffset);

  await db
    .insert(companyStrategyAssignments)
    .values({
      companyId,
      strategyId,
      assignedAt,
      currentEmailStepIndex: 0,
      nextOutreachDueAt,
      lastAcknowledgedAt: null
    })
    .onConflictDoUpdate({
      target: companyStrategyAssignments.companyId,
      set: {
        strategyId,
        assignedAt,
        currentEmailStepIndex: 0,
        nextOutreachDueAt,
        lastAcknowledgedAt: null,
        updatedAt: new Date()
      }
    });

  return { nextOutreachDueAt };
}

export async function ensureProposalFollowupReminderCore(
  db: any,
  {
    companyId,
    proposalDate
  }: {
    companyId: string;
    proposalDate: Date;
  }
) {
  const dueAt = addDays(proposalDate, 7);
  const idempotencyKey = `stage:proposal-followup:${companyId}:${proposalDate.toISOString()}`;

  await db
    .insert(reminders)
    .values({
      companyId,
      title: "Proposal follow-up",
      dueAt,
      idempotencyKey,
      status: "open"
    })
    .onConflictDoNothing({ target: reminders.idempotencyKey });

  return { dueAt };
}

export async function ensureTrialCheckinRemindersCore(
  db: any,
  {
    companyId,
    trialStartDate
  }: {
    companyId: string;
    trialStartDate: Date;
  }
) {
  const offsets = [10, 20, 30];

  for (const n of offsets) {
    const dueAt = addDays(trialStartDate, n);
    const idempotencyKey = `stage:trial-checkin:${companyId}:${trialStartDate.toISOString()}:${n}`;

    await db
      .insert(reminders)
      .values({
        companyId,
        title: `Trial check-in (${n}d)` ,
        dueAt,
        idempotencyKey,
        status: "open"
      })
      .onConflictDoNothing({ target: reminders.idempotencyKey });
  }

  return { ok: true };
}

export async function ensureStageDrivenReminders(db: any, now = new Date()) {
  const cutoff = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365);

  const events = await db
    .select({
      companyId: companyStageEvents.companyId,
      toStage: companyStageEvents.toStage,
      metadata: companyStageEvents.metadata
    })
    .from(companyStageEvents)
    .where(
      and(
        gte(companyStageEvents.occurredAt, cutoff),
        or(
          eq(companyStageEvents.toStage, "evaluating-proposal" as any),
          eq(companyStageEvents.toStage, "trial-30-day" as any)
        )
      )
    )
    .limit(5000);

  let ensuredProposal = 0;
  let ensuredTrial = 0;

  for (const e of events) {
    if (e.toStage === ("evaluating-proposal" as any)) {
      const raw = (e.metadata as any)?.proposalDate;
      if (!raw) continue;
      const proposalDate = new Date(String(raw));
      if (Number.isNaN(proposalDate.getTime())) continue;

      await ensureProposalFollowupReminderCore(db, { companyId: e.companyId, proposalDate });
      ensuredProposal += 1;
    }

    if (e.toStage === ("trial-30-day" as any)) {
      const raw = (e.metadata as any)?.trialStartDate;
      if (!raw) continue;
      const trialStartDate = new Date(String(raw));
      if (Number.isNaN(trialStartDate.getTime())) continue;

      await ensureTrialCheckinRemindersCore(db, { companyId: e.companyId, trialStartDate });
      ensuredTrial += 1;
    }
  }

  return { ensuredProposal, ensuredTrial };
}
