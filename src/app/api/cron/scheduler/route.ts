import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { ensureCadenceStepReminders } from "@/db/cadenceReminders";
import { ensureLineRenewalReminders } from "@/db/lineRenewalReminders";
import { ensureRenewalReminders } from "@/db/renewalReminders";
import { ensureStageDrivenReminders } from "@/db/stageWorkflowsCore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  // Minimal protection so random visitors can't trigger jobs.
  // You can set CRON_SECRET in Vercel and call /api/cron/scheduler?token=...
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const cadence = await ensureCadenceStepReminders(db);
  const renewals = await ensureRenewalReminders(db);
  const stage = await ensureStageDrivenReminders(db);
  const lineRenewals = await ensureLineRenewalReminders(db);

  return NextResponse.json({ ok: true, cadence, renewals, stage, lineRenewals });
}
