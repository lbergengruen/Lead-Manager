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
  const body = (await request.json()) as { name?: string; notes?: string | null };

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const notes = body.notes !== undefined ? (String(body.notes).trim() || null) : undefined;

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
      updatedAt: new Date()
    })
    .where(eq(companies.id, id));

  return NextResponse.json({ ok: true });
}
