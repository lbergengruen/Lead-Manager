import { getDb } from "@/db";
import { seedDatabaseCore } from "@/db/seedCore";

export async function seedDatabase() {
  const db = getDb();
  return seedDatabaseCore(db);
}
