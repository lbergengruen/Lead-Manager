import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/db";
import { clients } from "@/db/schema";

export const dynamic = "force-dynamic";

async function updateClient(id: string, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const primaryContactEmail = String(formData.get("primaryContactEmail") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    throw new Error("Client name is required");
  }

  const db = getDb();
  await db
    .update(clients)
    .set({
      name,
      primaryContactEmail,
      notes,
      updatedAt: new Date()
    })
    .where(eq(clients.id, id));

  revalidatePath("/licenses");
  revalidatePath(`/licenses/clients/${id}`);
}

async function deleteClient(id: string) {
  "use server";

  const db = getDb();
  await db.delete(clients).where(eq(clients.id, id));

  revalidatePath("/licenses");
  redirect("/licenses");
}

export default async function ClientDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = getDb();
  const row = await db
    .select({
      id: clients.id,
      name: clients.name,
      primaryContactEmail: clients.primaryContactEmail,
      notes: clients.notes,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt
    })
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    notFound();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{row.name}</h1>
          <div style={{ color: "#475569", fontSize: 14 }}>{row.primaryContactEmail ?? ""}</div>
        </div>
        <div>
          <Link className="navLink" href="/licenses">
            Back
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Edit client</h2>
        <form action={updateClient.bind(null, row.id)}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Name
              <input
                name="name"
                defaultValue={row.name}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>
            <label>
              Primary contact email
              <input
                name="primaryContactEmail"
                type="email"
                defaultValue={row.primaryContactEmail ?? ""}
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
            <button formAction={deleteClient.bind(null, row.id)} type="submit">
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
