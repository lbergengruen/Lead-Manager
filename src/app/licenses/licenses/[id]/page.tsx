import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/db";
import { ensureRenewalReminders } from "@/db/renewalReminders";
import { clients, licenses } from "@/db/schema";

export const dynamic = "force-dynamic";

function parseDateTimeLocal(value: FormDataEntryValue | null) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toDateTimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${min}`;
}

async function updateLicense(id: string, formData: FormData) {
  "use server";

  const productName = String(formData.get("productName") ?? "").trim();
  const startDate = parseDateTimeLocal(formData.get("startDate"));
  const renewalDate = parseDateTimeLocal(formData.get("renewalDate"));
  const statusRaw = String(formData.get("status") ?? "active").trim();

  if (!productName) {
    throw new Error("Product name is required");
  }

  if (!startDate || !renewalDate) {
    throw new Error("Start date and renewal date are required");
  }

  if (!(["active", "canceled", "expired"] as const).includes(statusRaw as any)) {
    throw new Error("Invalid status");
  }

  const db = getDb();
  await db
    .update(licenses)
    .set({
      productName,
      startDate,
      renewalDate,
      status: statusRaw as any,
      updatedAt: new Date()
    })
    .where(eq(licenses.id, id));

  await ensureRenewalReminders(db);

  revalidatePath("/licenses");
  revalidatePath("/reminders");
  revalidatePath(`/licenses/licenses/${id}`);
}

async function deleteLicense(id: string) {
  "use server";

  const db = getDb();
  await db.delete(licenses).where(eq(licenses.id, id));

  revalidatePath("/licenses");
  revalidatePath("/reminders");
  redirect("/licenses");
}

export default async function LicenseDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = getDb();

  const row = await db
    .select({
      id: licenses.id,
      clientId: licenses.clientId,
      productName: licenses.productName,
      startDate: licenses.startDate,
      renewalDate: licenses.renewalDate,
      status: licenses.status,
      createdAt: licenses.createdAt,
      updatedAt: licenses.updatedAt
    })
    .from(licenses)
    .where(eq(licenses.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    notFound();
  }

  const client = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, row.clientId))
    .limit(1)
    .then((r) => r[0]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{row.productName}</h1>
          <div style={{ color: "#475569", fontSize: 14 }}>{client?.name ?? ""}</div>
        </div>
        <div>
          <Link className="navLink" href="/licenses">
            Back
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Edit license</h2>
        <form action={updateLicense.bind(null, row.id)}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Product name
              <input
                name="productName"
                defaultValue={row.productName}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Start date
              <input
                name="startDate"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(row.startDate)}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Renewal date
              <input
                name="renewalDate"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(row.renewalDate)}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Status
              <select name="status" defaultValue={row.status} style={{ display: "block", marginTop: 6 }}>
                <option value="active">active</option>
                <option value="canceled">canceled</option>
                <option value="expired">expired</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button type="submit">Save</button>
            <button formAction={deleteLicense.bind(null, row.id)} type="submit">
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
