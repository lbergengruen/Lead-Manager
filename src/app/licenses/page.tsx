import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

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

async function createClient(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const primaryContactEmail = String(formData.get("primaryContactEmail") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    throw new Error("Client name is required");
  }

  const db = getDb();
  const created = await db
    .insert(clients)
    .values({
      name,
      primaryContactEmail,
      notes
    })
    .returning({ id: clients.id });

  const id = created[0]?.id;
  revalidatePath("/licenses");
  if (id) redirect(`/licenses/clients/${id}`);
}

async function createLicense(formData: FormData) {
  "use server";

  const clientId = String(formData.get("clientId") ?? "").trim();
  const productName = String(formData.get("productName") ?? "").trim();
  const startDate = parseDateTimeLocal(formData.get("startDate"));
  const renewalDate = parseDateTimeLocal(formData.get("renewalDate"));
  const renewalCadenceRaw = String(formData.get("renewalCadence") ?? "annual").trim();

  if (!clientId) {
    throw new Error("Client is required");
  }

  if (!productName) {
    throw new Error("Product name is required");
  }

  if (!startDate || !renewalDate) {
    throw new Error("Start date and renewal date are required");
  }

  if (!(["annual", "monthly", "custom"] as const).includes(renewalCadenceRaw as any)) {
    throw new Error("Invalid renewal cadence");
  }

  const db = getDb();
  const created = await db
    .insert(licenses)
    .values({
      clientId,
      productName,
      startDate,
      renewalDate,
      renewalCadence: renewalCadenceRaw as any,
      status: "active"
    })
    .returning({ id: licenses.id });

  await ensureRenewalReminders(db);

  const id = created[0]?.id;
  revalidatePath("/licenses");
  revalidatePath("/reminders");
  if (id) redirect(`/licenses/licenses/${id}`);
}

export default async function LicensesPage() {
  const db = getDb();

  const clientRows = await db
    .select({
      id: clients.id,
      name: clients.name,
      primaryContactEmail: clients.primaryContactEmail
    })
    .from(clients)
    .orderBy(desc(clients.createdAt))
    .limit(100);

  const licenseRows = await db
    .select({
      id: licenses.id,
      productName: licenses.productName,
      renewalDate: licenses.renewalDate,
      status: licenses.status,
      clientId: licenses.clientId
    })
    .from(licenses)
    .orderBy(desc(licenses.renewalDate))
    .limit(100);

  const now = new Date();
  const startDefault = toDateTimeLocalValue(now);
  const renewalDefault = toDateTimeLocalValue(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365));

  return (
    <div>
      <h1>Licenses</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Create client</h2>
        <form action={createClient}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Name
              <input name="name" style={{ display: "block", marginTop: 6, width: "100%" }} />
            </label>
            <label>
              Primary contact email
              <input
                name="primaryContactEmail"
                type="email"
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>
            <label>
              Notes
              <textarea
                name="notes"
                style={{ display: "block", marginTop: 6, width: "100%", minHeight: 80 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Create client</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Create license</h2>
        <form action={createLicense}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Client
              <select name="clientId" defaultValue="" style={{ display: "block", marginTop: 6 }}>
                <option value="">Select a client</option>
                {clientRows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Product name
              <input
                name="productName"
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Start date
              <input
                name="startDate"
                type="datetime-local"
                defaultValue={startDefault}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Renewal date
              <input
                name="renewalDate"
                type="datetime-local"
                defaultValue={renewalDefault}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Renewal cadence
              <select name="renewalCadence" defaultValue="annual" style={{ display: "block", marginTop: 6 }}>
                <option value="annual">annual</option>
                <option value="monthly">monthly</option>
                <option value="custom">custom</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Create license</button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Clients</h2>
        {clientRows.length === 0 ? (
          <p>No clients yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {clientRows.map((c) => (
              <Link key={c.id} className="card" href={`/licenses/clients/${c.id}`}>
                <div className="cardTitle">{c.name}</div>
                <p className="cardDesc">{c.primaryContactEmail ?? ""}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Licenses</h2>
        {licenseRows.length === 0 ? (
          <p>No licenses yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {licenseRows.map((l) => (
              <Link key={l.id} className="card" href={`/licenses/licenses/${l.id}`}>
                <div className="cardTitle">{l.productName}</div>
                <p className="cardDesc">Renewal: {l.renewalDate.toISOString()}</p>
                <p className="cardDesc">{l.status}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
