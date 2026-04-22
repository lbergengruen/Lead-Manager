import { and, desc, ilike, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { getDb } from "@/db";
import { seedDatabase } from "@/db/seed";
import { leads } from "@/db/schema";

export const dynamic = "force-dynamic";

async function createLead(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const primaryEmail = String(formData.get("primaryEmail") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name && !company) {
    throw new Error("Provide at least a name or company");
  }

  if (!primaryEmail && !phone) {
    throw new Error("Provide at least one contact method (email or phone)");
  }

  const db = getDb();
  await db.insert(leads).values({
    name,
    company,
    primaryEmail,
    phone
  });

  revalidatePath("/leads");
}

async function devSeed() {
  "use server";

  if (process.env.NODE_ENV !== "development") {
    throw new Error("Not found");
  }

  await seedDatabase();
  revalidatePath("/leads");
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = String(sp?.q ?? "").trim();
  const qLike = `%${q}%`;

  const conditions = [isNull(leads.deletedAt)];

  if (q) {
    const searchCondition = or(
      ilike(leads.name, qLike),
      ilike(leads.company, qLike),
      ilike(leads.primaryEmail, qLike)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const db = getDb();
  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      company: leads.company,
      primaryEmail: leads.primaryEmail,
      phone: leads.phone,
      status: leads.status,
      createdAt: leads.createdAt
    })
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(100);

  return (
    <div>
      <h1>Leads</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <form method="get" action="/leads">
          <label>
            Search
            <input
              name="q"
              defaultValue={q}
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
          </label>
          <div style={{ marginTop: 10 }}>
            <button type="submit">Search</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Create lead</h2>
        <form action={createLead}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Name
              <input name="name" style={{ display: "block", marginTop: 6, width: "100%" }} />
            </label>

            <label>
              Company
              <input
                name="company"
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Primary email
              <input
                name="primaryEmail"
                type="email"
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Phone
              <input name="phone" style={{ display: "block", marginTop: 6, width: "100%" }} />
            </label>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button type="submit">Create</button>
            {process.env.NODE_ENV === "development" ? (
              <button formAction={devSeed} type="submit">
                Seed sample data
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Results</h2>
        {rows.length === 0 ? (
          <p>No leads found.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r: (typeof rows)[number]) => (
              <Link key={r.id} className="card" href={`/leads/${r.id}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="cardTitle">{r.name ?? r.company ?? "(Unnamed lead)"}</div>
                    <p className="cardDesc">
                      {r.company ? `${r.company} · ` : ""}
                      {r.primaryEmail ?? r.phone ?? "No contact info"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#475569" }}>{r.status}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
