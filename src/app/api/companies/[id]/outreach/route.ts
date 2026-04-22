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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const db = getDb();

  const assignment = await db
    .select({
      id: companyStrategyAssignments.id,
      companyId: companyStrategyAssignments.companyId,
      strategyId: companyStrategyAssignments.strategyId,
      assignedAt: companyStrategyAssignments.assignedAt,
      currentEmailStepIndex: companyStrategyAssignments.currentEmailStepIndex,
      nextOutreachDueAt: companyStrategyAssignments.nextOutreachDueAt,
      lastAcknowledgedAt: companyStrategyAssignments.lastAcknowledgedAt
    })
    .from(companyStrategyAssignments)
    .where(eq(companyStrategyAssignments.companyId, companyId))
    .limit(1)
    .then((r) => r[0]);

  if (!assignment) {
    return NextResponse.json({ ok: true, assignment: null, email: null });
  }

  const email = await db
    .select({
      id: strategyEmails.id,
      stepIndex: strategyEmails.stepIndex,
      dayOffset: strategyEmails.dayOffset,
      subjectTemplate: strategyEmails.subjectTemplate,
      bodyTemplate: strategyEmails.bodyTemplate
    })
    .from(strategyEmails)
    .where(
      and(
        eq(strategyEmails.strategyId, assignment.strategyId),
        eq(strategyEmails.stepIndex, assignment.currentEmailStepIndex)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  return NextResponse.json({
    ok: true,
    assignment: {
      ...assignment,
      assignedAt: assignment.assignedAt.toISOString(),
      nextOutreachDueAt: assignment.nextOutreachDueAt
        ? assignment.nextOutreachDueAt.toISOString()
        : null,
      lastAcknowledgedAt: assignment.lastAcknowledgedAt
        ? assignment.lastAcknowledgedAt.toISOString()
        : null
    },
    email
  });
}
