import { getDb } from "@/db";
import {
  backfillCompaniesAndContactsCore,
  backfillLinesAndContractsCore,
  runBackfillAllCore
} from "@/db/backfillCore";

export async function backfillCompaniesAndContacts() {
  const db = getDb();
  return backfillCompaniesAndContactsCore(db);
}

export async function backfillLinesAndContracts() {
  const db = getDb();
  return backfillLinesAndContractsCore(db);
}

export async function runBackfillAll() {
  const db = getDb();
  return runBackfillAllCore(db);
}
