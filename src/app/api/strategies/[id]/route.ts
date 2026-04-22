import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { strategies } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { name?: string; description?: string | null };

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const description = body.description !== undefined ? (String(body.description).trim() || null) : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
  }

  const db = getDb();

  const existing = await db
    .select({ id: strategies.id })
    .from(strategies)
    .where(eq(strategies.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(strategies)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      updatedAt: new Date()
    })
    .where(eq(strategies.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.delete(strategies).where(eq(strategies.id, id));
  return NextResponse.json({ ok: true });
}
