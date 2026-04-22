import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companyLines } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { name?: string; isInvoiced?: boolean };

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const isInvoiced = body.isInvoiced !== undefined ? Boolean(body.isInvoiced) : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
  }

  const db = getDb();

  const existing = await db
    .select({ id: companyLines.id })
    .from(companyLines)
    .where(eq(companyLines.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(companyLines)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(isInvoiced !== undefined ? { isInvoiced } : {}),
      updatedAt: new Date()
    })
    .where(eq(companyLines.id, id));

  return NextResponse.json({ ok: true });
}
