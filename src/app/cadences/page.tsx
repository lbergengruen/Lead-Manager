import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { cadenceSteps, cadences } from "@/db/schema";

export const dynamic = "force-dynamic";

function parseIntField(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  return n;
}

async function createCadence(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  const step0Delay = parseIntField(formData.get("step0Delay")) ?? 0;
  const step0Subject = String(formData.get("step0Subject") ?? "").trim();
  const step0Body = String(formData.get("step0Body") ?? "").trim();

  const step1DelayRaw = parseIntField(formData.get("step1Delay"));
  const step1Delay = step1DelayRaw ?? null;
  const step1Subject = String(formData.get("step1Subject") ?? "").trim();
  const step1Body = String(formData.get("step1Body") ?? "").trim();

  if (!name) {
    throw new Error("Name is required");
  }

  if (!step0Subject || !step0Body) {
    throw new Error("Step 0 subject and body are required");
  }

  const db = getDb();

  const created = await db
    .insert(cadences)
    .values({
      name,
      description,
      isActive: true
    })
    .returning({ id: cadences.id });

  const cadenceId = created[0]?.id;
  if (!cadenceId) {
    throw new Error("Failed to create cadence");
  }

  await db.insert(cadenceSteps).values({
    cadenceId,
    stepIndex: 0,
    delayDaysFromPrevious: step0Delay,
    subjectTemplate: step0Subject,
    bodyTemplate: step0Body
  });

  const shouldCreateStep1 =
    step1Delay !== null || Boolean(step1Subject) || Boolean(step1Body);

  if (shouldCreateStep1) {
    if (step1Delay === null || !step1Subject || !step1Body) {
      throw new Error("Step 1 requires delay, subject, and body");
    }

    await db.insert(cadenceSteps).values({
      cadenceId,
      stepIndex: 1,
      delayDaysFromPrevious: step1Delay,
      subjectTemplate: step1Subject,
      bodyTemplate: step1Body
    });
  }

  revalidatePath("/cadences");
  redirect(`/cadences/${cadenceId}`);
}

async function deleteCadence(id: string) {
  "use server";

  const db = getDb();
  await db.delete(cadences).where(eq(cadences.id, id));
  revalidatePath("/cadences");
  redirect("/cadences");
}

export default async function CadencesPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: cadences.id,
      name: cadences.name,
      description: cadences.description,
      isActive: cadences.isActive,
      createdAt: cadences.createdAt
    })
    .from(cadences)
    .orderBy(desc(cadences.createdAt))
    .limit(100);

  return (
    <div>
      <h1>Cadences</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Create cadence</h2>
        <form action={createCadence}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Name
              <input name="name" style={{ display: "block", marginTop: 6, width: "100%" }} />
            </label>

            <label>
              Description
              <input
                name="description"
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>Step 0</div>
              <label>
                Delay days from previous
                <input
                  name="step0Delay"
                  type="number"
                  defaultValue={0}
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Subject template
                <input
                  name="step0Subject"
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Body template
                <textarea
                  name="step0Body"
                  style={{ display: "block", marginTop: 6, width: "100%", minHeight: 100 }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>Step 1 (optional)</div>
              <label>
                Delay days from previous
                <input
                  name="step1Delay"
                  type="number"
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Subject template
                <input
                  name="step1Subject"
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Body template
                <textarea
                  name="step1Body"
                  style={{ display: "block", marginTop: 6, width: "100%", minHeight: 100 }}
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Existing</h2>
        {rows.length === 0 ? (
          <p>No cadences yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r) => (
              <div key={r.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="cardTitle">{r.name}</div>
                    <p className="cardDesc">{r.description ?? ""}</p>
                    <p className="cardDesc">{r.isActive ? "active" : "inactive"}</p>
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <Link className="navLink" href={`/cadences/${r.id}`}>
                      Open
                    </Link>
                    <form action={deleteCadence.bind(null, r.id)}>
                      <button type="submit">Delete</button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
