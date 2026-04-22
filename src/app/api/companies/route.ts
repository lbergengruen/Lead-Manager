import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { companies } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; notes?: string | null };

  const name = String(body.name ?? "").trim();
  const notes = body.notes !== undefined ? (String(body.notes).trim() || null) : null;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const db = getDb();

  try {
    const inserted = await db
      .insert(companies)
      .values({ name, notes, stage: "dead-lead" })
      .returning({ id: companies.id, stage: companies.stage });

    const row = inserted[0];
    if (!row?.id) {
      return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      company: {
        id: row.id,
        name,
        notes,
        stage: row.stage
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
