import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companyContacts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const body = (await request.json()) as {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    isPrimary?: boolean;
  };

  const name = body.name ? String(body.name).trim() : null;
  const email = body.email ? String(body.email).trim() : null;
  const phone = body.phone ? String(body.phone).trim() : null;
  const role = body.role ? String(body.role).trim() : null;
  const isPrimary = Boolean(body.isPrimary);

  if (!name && !email && !phone) {
    return NextResponse.json(
      { error: "At least one of name, email, or phone is required" },
      { status: 400 }
    );
  }

  const db = getDb();

  if (isPrimary) {
    await db
      .update(companyContacts)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(companyContacts.companyId, companyId));
  }

  const created = await db
    .insert(companyContacts)
    .values({
      companyId,
      name,
      email,
      phone,
      role,
      isPrimary
    })
    .returning({ id: companyContacts.id });

  const contactId = created[0]?.id;
  if (!contactId) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: contactId });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const db = getDb();
  const rows = await db
    .select({
      id: companyContacts.id,
      companyId: companyContacts.companyId,
      name: companyContacts.name,
      email: companyContacts.email,
      phone: companyContacts.phone,
      role: companyContacts.role,
      isPrimary: companyContacts.isPrimary
    })
    .from(companyContacts)
    .where(eq(companyContacts.companyId, companyId));

  return NextResponse.json({ ok: true, contacts: rows });
}
