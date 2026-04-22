import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companyStrategyAssignments, strategyEmails } from "@/db/schema";

export const dynamic = "force-dynamic";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const body = (await request.json()) as { acknowledgedAt?: string };

  const acknowledgedAt = body.acknowledgedAt ? new Date(body.acknowledgedAt) : new Date();

  const db = getDb();

  const assignment = await db
    .select({
      id: companyStrategyAssignments.id,
      strategyId: companyStrategyAssignments.strategyId,
      assignedAt: companyStrategyAssignments.assignedAt,
      currentEmailStepIndex: companyStrategyAssignments.currentEmailStepIndex
    })
    .from(companyStrategyAssignments)
    .where(eq(companyStrategyAssignments.companyId, companyId))
    .limit(1)
    .then((r) => r[0]);

  if (!assignment) {
    return NextResponse.json({ error: "No assignment" }, { status: 400 });
  }

  const nextIndex = assignment.currentEmailStepIndex + 1;

  const nextEmail = await db
    .select({ dayOffset: strategyEmails.dayOffset })
    .from(strategyEmails)
    .where(and(eq(strategyEmails.strategyId, assignment.strategyId), eq(strategyEmails.stepIndex, nextIndex)))
    .limit(1)
    .then((r) => r[0]);

  const nextOutreachDueAt = nextEmail
    ? addDays(assignment.assignedAt, nextEmail.dayOffset)
    : null;

  await db
    .update(companyStrategyAssignments)
    .set({
      currentEmailStepIndex: nextIndex,
      nextOutreachDueAt,
      lastAcknowledgedAt: acknowledgedAt,
      updatedAt: new Date()
    })
    .where(eq(companyStrategyAssignments.id, assignment.id));

  return NextResponse.json({
    ok: true,
    nextOutreachDueAt: nextOutreachDueAt ? nextOutreachDueAt.toISOString() : null
  });
}
