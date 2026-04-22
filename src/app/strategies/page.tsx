import { desc } from "drizzle-orm";

import { getDb } from "@/db";
import { strategies } from "@/db/schema";

import { StrategiesClient, type StrategyListItem } from "@/app/strategies/strategiesClient";

export const dynamic = "force-dynamic";

export default async function StrategiesPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: strategies.id,
      name: strategies.name,
      description: strategies.description,
      updatedAt: strategies.updatedAt
    })
    .from(strategies)
    .orderBy(desc(strategies.updatedAt))
    .limit(200);

  const items: StrategyListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    updatedAt: r.updatedAt.toISOString()
  }));

  return <StrategiesClient initialStrategies={items} />;
}
