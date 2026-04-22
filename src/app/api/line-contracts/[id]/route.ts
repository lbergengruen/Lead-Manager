import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { ensureLineContractRenewalReminderCore } from "@/db/lineRenewalReminders";
import { companyLines, lineContracts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    contractStartDate?: string;
    contractEndDate?: string;
    pricePerMonthCents?: number;
  };

  const contractStartDateRaw =
    body.contractStartDate !== undefined ? String(body.contractStartDate).trim() : undefined;
  const contractEndDateRaw =
    body.contractEndDate !== undefined ? String(body.contractEndDate).trim() : undefined;
  const pricePerMonthCents =
    body.pricePerMonthCents !== undefined ? Math.trunc(Number(body.pricePerMonthCents)) : undefined;

  const contractStartDate = contractStartDateRaw ? new Date(contractStartDateRaw) : undefined;
  const contractEndDate = contractEndDateRaw ? new Date(contractEndDateRaw) : undefined;

  if (contractStartDateRaw !== undefined && Number.isNaN(contractStartDate?.getTime())) {
    return NextResponse.json({ error: "invalid contractStartDate" }, { status: 400 });
  }
  if (contractEndDateRaw !== undefined && Number.isNaN(contractEndDate?.getTime())) {
    return NextResponse.json({ error: "invalid contractEndDate" }, { status: 400 });
  }
  if (pricePerMonthCents !== undefined && (!Number.isFinite(pricePerMonthCents) || pricePerMonthCents <= 0)) {
    return NextResponse.json({ error: "invalid pricePerMonthCents" }, { status: 400 });
  }

  if (contractStartDate && contractEndDate && contractStartDate > contractEndDate) {
    return NextResponse.json({ error: "contractStartDate must be <= contractEndDate" }, { status: 400 });
  }

  if (contractStartDate === undefined && contractEndDate === undefined && pricePerMonthCents === undefined) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const db = getDb();

  const existing = await db
    .select({
      id: lineContracts.id,
      companyId: companyLines.companyId,
      endDate: lineContracts.endDate
    })
    .from(lineContracts)
    .innerJoin(companyLines, eq(lineContracts.lineId, companyLines.id))
    .where(eq(lineContracts.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextEndDate = contractEndDate ?? existing.endDate;

  await db
    .update(lineContracts)
    .set({
      ...(contractStartDate ? { startDate: contractStartDate } : {}),
      ...(contractEndDate ? { endDate: contractEndDate } : {}),
      ...(pricePerMonthCents !== undefined ? { pricePerMonthCents } : {}),
      updatedAt: new Date()
    })
    .where(eq(lineContracts.id, id));

  await ensureLineContractRenewalReminderCore(db, {
    companyId: existing.companyId,
    lineContractId: id,
    contractEndDate: nextEndDate
  });

  return NextResponse.json({ ok: true });
}
