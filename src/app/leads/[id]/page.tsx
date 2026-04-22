import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/db";
import { leads } from "@/db/schema";

export const dynamic = "force-dynamic";

const leadStatuses = [
  "new",
  "contacted",
  "awaiting-reply",
  "follow-up-needed",
  "in-discussion",
  "won",
  "lost"
] as const;

async function updateLead(id: string, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const statusRaw = String(formData.get("status") ?? "").trim();
  const primaryEmail = String(formData.get("primaryEmail") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name && !company) {
    throw new Error("Provide at least a name or company");
  }

  if (!leadStatuses.includes(statusRaw as (typeof leadStatuses)[number])) {
    throw new Error("Invalid status");
  }

  const db = getDb();
  await db
    .update(leads)
    .set({
      name,
      company,
      status: statusRaw as (typeof leadStatuses)[number],
      primaryEmail,
      phone,
      website,
      source,
      notes,
      updatedAt: new Date()
    })
    .where(eq(leads.id, id));

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
}

async function softDeleteLead(id: string) {
  "use server";

  const db = getDb();
  await db
    .update(leads)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(leads.id, id));

  revalidatePath("/leads");
  redirect("/leads");
}

export default async function LeadDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = getDb();
  const row = await db
    .select({
      id: leads.id,
      name: leads.name,
      company: leads.company,
      primaryEmail: leads.primaryEmail,
      phone: leads.phone,
      website: leads.website,
      source: leads.source,
      notes: leads.notes,
      status: leads.status,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt
    })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row || row.deletedAt) {
    notFound();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{row.name ?? row.company ?? "Lead"}</h1>
          <div style={{ color: "#475569", fontSize: 14 }}>{row.status}</div>
        </div>
        <div>
          <Link className="navLink" href="/leads">
            Back to leads
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Edit</h2>
        <form action={updateLead.bind(null, row.id)}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Name
              <input
                name="name"
                defaultValue={row.name ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Company
              <input
                name="company"
                defaultValue={row.company ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Status
              <select
                name="status"
                defaultValue={row.status}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              >
                {leadStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Primary email
              <input
                name="primaryEmail"
                type="email"
                defaultValue={row.primaryEmail ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                defaultValue={row.phone ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Website
              <input
                name="website"
                defaultValue={row.website ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Source
              <input
                name="source"
                defaultValue={row.source ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                defaultValue={row.notes ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%", minHeight: 120 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button type="submit">Save</button>
            <button formAction={softDeleteLead.bind(null, row.id)} type="submit">
              Delete
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 12, color: "#475569", fontSize: 12 }}>
        Created: {row.createdAt.toISOString()} | Updated: {row.updatedAt.toISOString()}
      </div>
    </div>
  );
}
