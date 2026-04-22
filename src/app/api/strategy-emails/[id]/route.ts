import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { strategyEmails } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = (await request.json()) as {
    dayOffset?: number;
    subjectTemplate?: string;
    bodyTemplate?: string;
  };

  const dayOffset = body.dayOffset !== undefined ? Math.trunc(Number(body.dayOffset)) : undefined;
  const subjectTemplate = body.subjectTemplate !== undefined ? String(body.subjectTemplate).trim() : undefined;
  const bodyTemplate = body.bodyTemplate !== undefined ? String(body.bodyTemplate).trim() : undefined;

  if (dayOffset !== undefined && (!Number.isFinite(dayOffset) || dayOffset < 0)) {
    return NextResponse.json({ error: "invalid dayOffset" }, { status: 400 });
  }

  if (subjectTemplate !== undefined && !subjectTemplate) {
    return NextResponse.json({ error: "subjectTemplate cannot be empty" }, { status: 400 });
  }

  if (bodyTemplate !== undefined && !bodyTemplate) {
    return NextResponse.json({ error: "bodyTemplate cannot be empty" }, { status: 400 });
  }

  const db = getDb();

  await db
    .update(strategyEmails)
    .set({
      ...(dayOffset !== undefined ? { dayOffset } : {}),
      ...(subjectTemplate !== undefined ? { subjectTemplate } : {}),
      ...(bodyTemplate !== undefined ? { bodyTemplate } : {}),
      updatedAt: new Date()
    })
    .where(eq(strategyEmails.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.delete(strategyEmails).where(eq(strategyEmails.id, id));
  return NextResponse.json({ ok: true });
}
