import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { strategies } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({
      id: strategies.id,
      name: strategies.name,
      description: strategies.description,
      createdAt: strategies.createdAt,
      updatedAt: strategies.updatedAt
    })
    .from(strategies)
    .orderBy(desc(strategies.updatedAt))
    .limit(200);

  return NextResponse.json({ ok: true, strategies: rows });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; description?: string | null };

  const name = String(body.name ?? "").trim();
  const description = body.description ? String(body.description).trim() || null : null;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const db = getDb();
  const created = await db
    .insert(strategies)
    .values({
      name,
      description
    })
    .returning({ id: strategies.id });

  const id = created[0]?.id;
  if (!id) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
