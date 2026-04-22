import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { strategies, strategyEmails } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: strategyId } = await params;

  const db = getDb();

  const rows = await db
    .select({
      id: strategyEmails.id,
      strategyId: strategyEmails.strategyId,
      stepIndex: strategyEmails.stepIndex,
      dayOffset: strategyEmails.dayOffset,
      subjectTemplate: strategyEmails.subjectTemplate,
      bodyTemplate: strategyEmails.bodyTemplate
    })
    .from(strategyEmails)
    .where(eq(strategyEmails.strategyId, strategyId))
    .orderBy(asc(strategyEmails.stepIndex));

  return NextResponse.json({ ok: true, emails: rows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: strategyId } = await params;
  const body = (await request.json()) as {
    dayOffset?: number;
    subjectTemplate?: string;
    bodyTemplate?: string;
  };

  const dayOffset = Number.isFinite(body.dayOffset as any) ? Math.trunc(body.dayOffset as number) : null;
  const subjectTemplate = String(body.subjectTemplate ?? "").trim();
  const bodyTemplate = String(body.bodyTemplate ?? "").trim();

  if (dayOffset === null || dayOffset < 0) {
    return NextResponse.json({ error: "dayOffset required" }, { status: 400 });
  }

  if (!subjectTemplate || !bodyTemplate) {
    return NextResponse.json({ error: "subjectTemplate and bodyTemplate required" }, { status: 400 });
  }

  const db = getDb();

  const strategyExists = await db
    .select({ id: strategies.id })
    .from(strategies)
    .where(eq(strategies.id, strategyId))
    .limit(1)
    .then((r) => r[0]);

  if (!strategyExists) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  const last = await db
    .select({ stepIndex: strategyEmails.stepIndex })
    .from(strategyEmails)
    .where(eq(strategyEmails.strategyId, strategyId))
    .orderBy(desc(strategyEmails.stepIndex))
    .limit(1)
    .then((r) => r[0]);

  const stepIndex = (last?.stepIndex ?? -1) + 1;

  const created = await db
    .insert(strategyEmails)
    .values({
      strategyId,
      stepIndex,
      dayOffset,
      subjectTemplate,
      bodyTemplate
    })
    .returning({ id: strategyEmails.id });

  const id = created[0]?.id;
  if (!id) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, stepIndex });
}
