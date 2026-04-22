import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companies } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { name?: string; notes?: string | null; commissionPercentage?: number };

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const notes = body.notes !== undefined ? (String(body.notes).trim() || null) : undefined;
  const commissionPercentage = body.commissionPercentage !== undefined ? Math.trunc(Number(body.commissionPercentage)) : undefined;

  if (commissionPercentage !== undefined && (commissionPercentage < 0 || commissionPercentage > 100)) {
    return NextResponse.json({ error: "commissionPercentage must be between 0 and 100" }, { status: 400 });
  }

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
  }

  const db = getDb();

  const existing = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(companies)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(commissionPercentage !== undefined ? { commissionPercentage } : {}),
      updatedAt: new Date()
    })
    .where(eq(companies.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const existing = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(companies).where(eq(companies.id, id));
  return NextResponse.json({ ok: true });
}
