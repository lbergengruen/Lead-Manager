import { NextResponse } from "next/server";

import { seedDatabase } from "@/db/seed";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await seedDatabase();

  return NextResponse.json({ ok: true, result });
}
