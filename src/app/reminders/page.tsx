import { and, asc, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { getDb } from "@/db";
import { clients, leads, licenses, reminders } from "@/db/schema";

export const dynamic = "force-dynamic";

function parseDateTimeLocal(value: FormDataEntryValue | null) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function createReminder(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const dueAt = parseDateTimeLocal(formData.get("dueAt"));

  const leadIdRaw = String(formData.get("leadId") ?? "").trim();
  const licenseIdRaw = String(formData.get("licenseId") ?? "").trim();

  const leadId = leadIdRaw ? leadIdRaw : null;
  const licenseId = licenseIdRaw ? licenseIdRaw : null;

  if (!title) {
    throw new Error("Title is required");
  }

  if (!dueAt) {
    throw new Error("Due date is required");
  }

  const db = getDb();
  await db.insert(reminders).values({
    title,
    dueAt,
    leadId,
    licenseId,
    status: "open"
  });

  revalidatePath("/reminders");
}

async function markReminderDone(id: string) {
  "use server";

  const db = getDb();
  await db
    .update(reminders)
    .set({
      status: "done",
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(reminders.id, id));

  revalidatePath("/reminders");
}

async function cancelReminder(id: string) {
  "use server";

  const db = getDb();
  await db
    .update(reminders)
    .set({
      status: "canceled",
      updatedAt: new Date()
    })
    .where(eq(reminders.id, id));

  revalidatePath("/reminders");
}

async function snoozeReminder(id: string, formData: FormData) {
  "use server";

  const dueAt = parseDateTimeLocal(formData.get("dueAt"));
  if (!dueAt) {
    throw new Error("New due date is required");
  }

  const db = getDb();
  await db
    .update(reminders)
    .set({
      dueAt,
      updatedAt: new Date()
    })
    .where(eq(reminders.id, id));

  revalidatePath("/reminders");
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

export default async function RemindersPage() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const db = getDb();

  const openOverdue = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      dueAt: reminders.dueAt,
      leadId: reminders.leadId,
      licenseId: reminders.licenseId
    })
    .from(reminders)
    .where(and(eq(reminders.status, "open"), lt(reminders.dueAt, now)))
    .orderBy(asc(reminders.dueAt))
    .limit(200);

  const openToday = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      dueAt: reminders.dueAt,
      leadId: reminders.leadId,
      licenseId: reminders.licenseId
    })
    .from(reminders)
    .where(
      and(
        eq(reminders.status, "open"),
        gte(reminders.dueAt, startOfToday),
        lt(reminders.dueAt, startOfTomorrow)
      )
    )
    .orderBy(asc(reminders.dueAt))
    .limit(200);

  const openUpcoming = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      dueAt: reminders.dueAt,
      leadId: reminders.leadId,
      licenseId: reminders.licenseId
    })
    .from(reminders)
    .where(and(eq(reminders.status, "open"), gte(reminders.dueAt, startOfTomorrow)))
    .orderBy(asc(reminders.dueAt))
    .limit(200);

  const recentCompleted = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      dueAt: reminders.dueAt,
      status: reminders.status,
      completedAt: reminders.completedAt
    })
    .from(reminders)
    .where(and(eq(reminders.status, "done")))
    .orderBy(desc(reminders.completedAt))
    .limit(50);

  const leadOptions = await db
    .select({
      id: leads.id,
      name: leads.name,
      company: leads.company
    })
    .from(leads)
    .where(isNull(leads.deletedAt))
    .orderBy(desc(leads.createdAt))
    .limit(50);

  const licenseOptions = await db
    .select({
      licenseId: licenses.id,
      productName: licenses.productName,
      clientName: clients.name
    })
    .from(licenses)
    .innerJoin(clients, eq(licenses.clientId, clients.id))
    .orderBy(desc(licenses.renewalDate))
    .limit(50);

  const defaultDue = toDateTimeLocalValue(new Date(now.getTime() + 60 * 60 * 1000));

  const renderList = (
    title: string,
    items: typeof openOverdue,
    empty: string,
    showOverdue: boolean
  ) => {
    return (
      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {items.length === 0 ? (
          <p>{empty}</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((r) => (
              <div key={r.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="cardTitle">{r.title}</div>
                    <p className="cardDesc">
                      Due: {r.dueAt.toISOString()}
                      {showOverdue && r.dueAt < now ? " (overdue)" : ""}
                    </p>
                    <p className="cardDesc">
                      {r.leadId ? (
                        <>
                          Lead: <Link href={`/leads/${r.leadId}`}>{r.leadId}</Link>
                        </>
                      ) : r.licenseId ? (
                        <>License: {r.licenseId}</>
                      ) : (
                        <>Unattached</>
                      )}
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <form action={markReminderDone.bind(null, r.id)}>
                      <button type="submit">Done</button>
                    </form>
                    <form action={cancelReminder.bind(null, r.id)}>
                      <button type="submit">Cancel</button>
                    </form>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <form action={snoozeReminder.bind(null, r.id)}>
                    <label style={{ display: "block" }}>
                      Snooze to
                      <input
                        name="dueAt"
                        type="datetime-local"
                        defaultValue={toDateTimeLocalValue(new Date(now.getTime() + 24 * 60 * 60 * 1000))}
                        style={{ display: "block", marginTop: 6 }}
                      />
                    </label>
                    <div style={{ marginTop: 8 }}>
                      <button type="submit">Snooze</button>
                    </div>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1>Reminders</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Create reminder</h2>
        <form action={createReminder}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Title
              <input name="title" style={{ display: "block", marginTop: 6, width: "100%" }} />
            </label>

            <label>
              Due at
              <input
                name="dueAt"
                type="datetime-local"
                defaultValue={defaultDue}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Link to lead (optional)
              <select name="leadId" defaultValue="" style={{ display: "block", marginTop: 6 }}>
                <option value="">None</option>
                {leadOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name ?? l.company ?? l.id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Link to license (optional)
              <select name="licenseId" defaultValue="" style={{ display: "block", marginTop: 6 }}>
                <option value="">None</option>
                {licenseOptions.map((x) => (
                  <option key={x.licenseId} value={x.licenseId}>
                    {x.clientName} · {x.productName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>

      {renderList("Overdue", openOverdue, "No overdue reminders.", true)}
      {renderList("Today", openToday, "No reminders due today.", false)}
      {renderList("Upcoming", openUpcoming, "No upcoming reminders.", false)}

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Recently done</h2>
        {recentCompleted.length === 0 ? (
          <p>No completed reminders yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {recentCompleted.map((r) => (
              <div key={r.id} className="card">
                <div className="cardTitle">{r.title}</div>
                <p className="cardDesc">
                  Completed: {r.completedAt ? r.completedAt.toISOString() : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
