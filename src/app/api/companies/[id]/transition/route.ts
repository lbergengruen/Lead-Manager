import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { assignStrategyToCompanyCore, ensureProposalFollowupReminderCore, ensureTrialCheckinRemindersCore } from "@/db/stageWorkflowsCore";
import { ensureLineContractRenewalReminderCore } from "@/db/lineRenewalReminders";
import { companies, companyLines, companyStageEvents, lineContracts, strategies } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const body = (await request.json()) as {
    toStage?: string;
    occurredAt?: string;
    strategyId?: string;
    proposalDate?: string;
    trialStartDate?: string;
    clientLine?: {
      name?: string;
      contractStartDate?: string;
      contractEndDate?: string;
      pricePerMonthCents?: number;
    };
  };

  const toStage = String(body.toStage ?? "").trim();
  if (!toStage) {
    return NextResponse.json({ error: "toStage required" }, { status: 400 });
  }

  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();

  const db = getDb();
  const current = await db
    .select({ stage: companies.stage })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)
    .then((r) => r[0]);

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (toStage === "contacted") {
    const strategyId = String(body.strategyId ?? "").trim();
    if (!strategyId) {
      return NextResponse.json({ error: "strategyId required" }, { status: 400 });
    }

    const assignment = await assignStrategyToCompanyCore(db, { companyId, strategyId, assignedAt: occurredAt });

    const strategy = await db
      .select({ id: strategies.id, name: strategies.name })
      .from(strategies)
      .where(eq(strategies.id, strategyId))
      .limit(1)
      .then((r) => r[0]);

    await db
      .update(companies)
      .set({ stage: toStage as any, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await db.insert(companyStageEvents).values({
      companyId,
      fromStage: current.stage,
      toStage: toStage as any,
      occurredAt,
      strategyId
    });

    return NextResponse.json({
      ok: true,
      assignment: {
        nextOutreachDueAt: assignment.nextOutreachDueAt.toISOString(),
        strategy: {
          id: strategyId,
          name: strategy?.name ?? strategyId
        }
      }
    });
  }

  if (toStage === "evaluating-proposal") {
    const proposalDateRaw = String(body.proposalDate ?? "").trim();
    if (!proposalDateRaw) {
      return NextResponse.json({ error: "proposalDate required" }, { status: 400 });
    }

    const proposalDate = new Date(proposalDateRaw);
    if (Number.isNaN(proposalDate.getTime())) {
      return NextResponse.json({ error: "invalid proposalDate" }, { status: 400 });
    }

    await ensureProposalFollowupReminderCore(db, { companyId, proposalDate });

    await db
      .update(companies)
      .set({ stage: toStage as any, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await db.insert(companyStageEvents).values({
      companyId,
      fromStage: current.stage,
      toStage: toStage as any,
      occurredAt,
      metadata: {
        proposalDate: proposalDate.toISOString()
      }
    });

    return NextResponse.json({ ok: true });
  }

  if (toStage === "client") {
    const existingLines = await db
      .select({ id: companyLines.id })
      .from(companyLines)
      .where(eq(companyLines.companyId, companyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    const requiresLine = !existingLines;
    const linePayload = body.clientLine;

    if (requiresLine && !linePayload) {
      return NextResponse.json({ error: "clientLine required" }, { status: 400 });
    }

    let createdLine: any | null = null;

    if (linePayload && linePayload.name) {
      const name = String(linePayload.name).trim();
      const contractStartDateRaw = String(linePayload.contractStartDate ?? "").trim();
      const contractEndDateRaw = String(linePayload.contractEndDate ?? "").trim();
      const pricePerMonthCents = Math.trunc(Number(linePayload.pricePerMonthCents));

      if (!name) {
        return NextResponse.json({ error: "clientLine.name required" }, { status: 400 });
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

      createdLine = {
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
      };
    } else if (requiresLine) {
      return NextResponse.json({ error: "clientLine.name required" }, { status: 400 });
    }

    await db
      .update(companies)
      .set({ stage: toStage as any, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await db.insert(companyStageEvents).values({
      companyId,
      fromStage: current.stage,
      toStage: toStage as any,
      occurredAt
    });

    return NextResponse.json({ ok: true, createdLine });
  }

  if (toStage === "trial-30-day") {
    const trialStartRaw = String(body.trialStartDate ?? "").trim();
    if (!trialStartRaw) {
      return NextResponse.json({ error: "trialStartDate required" }, { status: 400 });
    }

    const trialStartDate = new Date(trialStartRaw);
    if (Number.isNaN(trialStartDate.getTime())) {
      return NextResponse.json({ error: "invalid trialStartDate" }, { status: 400 });
    }

    await ensureTrialCheckinRemindersCore(db, { companyId, trialStartDate });

    await db
      .update(companies)
      .set({ stage: toStage as any, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await db.insert(companyStageEvents).values({
      companyId,
      fromStage: current.stage,
      toStage: toStage as any,
      occurredAt,
      metadata: {
        trialStartDate: trialStartDate.toISOString()
      }
    });

    return NextResponse.json({ ok: true });
  }

  await db
    .update(companies)
    .set({ stage: toStage as any, updatedAt: new Date() })
    .where(eq(companies.id, companyId));

  await db.insert(companyStageEvents).values({
    companyId,
    fromStage: current.stage,
    toStage: toStage as any,
    occurredAt
  });

  return NextResponse.json({ ok: true });
}
