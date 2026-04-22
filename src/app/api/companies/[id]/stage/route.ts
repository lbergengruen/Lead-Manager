import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companies, companyStageEvents } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { toStage?: string; occurredAt?: string };

  const toStage = String(body.toStage ?? "").trim();
  if (!toStage) {
    return NextResponse.json({ error: "toStage required" }, { status: 400 });
  }

  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();

  const db = getDb();

  const current = await db
    .select({ stage: companies.stage })
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(companies)
    .set({
      stage: toStage as any,
      updatedAt: new Date()
    })
    .where(eq(companies.id, id));

  await db.insert(companyStageEvents).values({
    companyId: id,
    fromStage: current.stage,
    toStage: toStage as any,
    occurredAt
  });

  return NextResponse.json({ ok: true });
}
