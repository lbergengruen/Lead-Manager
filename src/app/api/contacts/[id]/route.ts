import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companyContacts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = (await request.json()) as {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    isPrimary?: boolean;
  };

  const db = getDb();

  const existing = await db
    .select({ id: companyContacts.id, companyId: companyContacts.companyId })
    .from(companyContacts)
    .where(eq(companyContacts.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = body.name !== undefined ? (String(body.name).trim() || null) : undefined;
  const email = body.email !== undefined ? (String(body.email).trim() || null) : undefined;
  const phone = body.phone !== undefined ? (String(body.phone).trim() || null) : undefined;
  const role = body.role !== undefined ? (String(body.role).trim() || null) : undefined;
  const isPrimary = body.isPrimary !== undefined ? Boolean(body.isPrimary) : undefined;

  if (isPrimary === true) {
    await db
      .update(companyContacts)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(companyContacts.companyId, existing.companyId));
  }

  await db
    .update(companyContacts)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(isPrimary !== undefined ? { isPrimary } : {}),
      updatedAt: new Date()
    })
    .where(eq(companyContacts.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const db = getDb();
  await db.delete(companyContacts).where(eq(companyContacts.id, id));
  return NextResponse.json({ ok: true });
}
