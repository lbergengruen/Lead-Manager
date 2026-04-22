import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { ensureLineContractRenewalReminderCore } from "@/db/lineRenewalReminders";
import { companies, companyLines, lineContracts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const body = (await request.json()) as {
    name?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    pricePerMonthCents?: number;
  };

  const name = String(body.name ?? "").trim();
  const contractStartDateRaw = String(body.contractStartDate ?? "").trim();
  const contractEndDateRaw = String(body.contractEndDate ?? "").trim();
  const pricePerMonthCents = Math.trunc(Number(body.pricePerMonthCents));

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (!contractStartDateRaw || !contractEndDateRaw) {
    return NextResponse.json({ error: "contract dates required" }, { status: 400 });
  }
  if (!Number.isFinite(pricePerMonthCents) || pricePerMonthCents <= 0) {
    return NextResponse.json({ error: "invalid pricePerMonthCents" }, { status: 400 });
  }

  const contractStartDate = new Date(contractStartDateRaw);
  const contractEndDate = new Date(contractEndDateRaw);
  if (Number.isNaN(contractStartDate.getTime()) || Number.isNaN(contractEndDate.getTime())) {
    return NextResponse.json({ error: "invalid contract dates" }, { status: 400 });
  }

  const db = getDb();

  const existingCompany = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)
    .then((r) => r[0]);

  if (!existingCompany) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const insertedLine = await db
    .insert(companyLines)
    .values({ companyId, name, isInvoiced: false })
    .returning({ id: companyLines.id });

  const lineId = insertedLine[0]?.id;
  if (!lineId) {
    return NextResponse.json({ error: "Failed to create line" }, { status: 500 });
  }

  const insertedContract = await db
    .insert(lineContracts)
    .values({
      lineId,
      startDate: contractStartDate,
      endDate: contractEndDate,
      pricePerMonthCents
    })
    .returning({ id: lineContracts.id });

  const contractId = insertedContract[0]?.id;
  if (!contractId) {
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }

  await ensureLineContractRenewalReminderCore(db, {
    companyId,
    lineContractId: contractId,
    contractEndDate
  });

  return NextResponse.json({
    ok: true,
    line: {
      id: lineId,
      name,
      isInvoiced: false,
      contracts: [
        {
          id: contractId,
          startDate: contractStartDate.toISOString(),
          endDate: contractEndDate.toISOString(),
          pricePerMonthCents
        }
      ]
    }
  });
}
