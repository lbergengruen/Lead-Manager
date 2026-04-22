import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/db";
import {
  cadenceSteps,
  cadences,
  emailActivities,
  leadCadenceEnrollments,
  leads
} from "@/db/schema";

export const dynamic = "force-dynamic";

function parseIntField(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  return n;
}

async function updateCadence(id: string, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    throw new Error("Name is required");
  }

  const db = getDb();
  await db
    .update(cadences)
    .set({
      name,
      description,
      isActive,
      updatedAt: new Date()
    })
    .where(eq(cadences.id, id));

  revalidatePath(`/cadences/${id}`);
  revalidatePath("/cadences");
}

async function addStep(cadenceId: string, formData: FormData) {
  "use server";

  const stepIndex = parseIntField(formData.get("stepIndex"));
  const delayDaysFromPrevious = parseIntField(formData.get("delayDaysFromPrevious"));
  const subjectTemplate = String(formData.get("subjectTemplate") ?? "").trim();
  const bodyTemplate = String(formData.get("bodyTemplate") ?? "").trim();

  if (stepIndex === null) {
    throw new Error("Step index is required");
  }

  if (delayDaysFromPrevious === null) {
    throw new Error("Delay days is required");
  }

  if (!subjectTemplate || !bodyTemplate) {
    throw new Error("Subject and body are required");
  }

  const db = getDb();
  await db.insert(cadenceSteps).values({
    cadenceId,
    stepIndex,
    delayDaysFromPrevious,
    subjectTemplate,
    bodyTemplate
  });

  revalidatePath(`/cadences/${cadenceId}`);
}

async function deleteStep(cadenceId: string, stepId: string) {
  "use server";

  const db = getDb();
  await db.delete(cadenceSteps).where(eq(cadenceSteps.id, stepId));

  revalidatePath(`/cadences/${cadenceId}`);
}

async function enrollLead(cadenceId: string, formData: FormData) {
  "use server";

  const leadId = String(formData.get("leadId") ?? "").trim();
  if (!leadId) {
    throw new Error("Lead is required");
  }

  const db = getDb();

  const step0 = await db
    .select({
      delay: cadenceSteps.delayDaysFromPrevious
    })
    .from(cadenceSteps)
    .where(and(eq(cadenceSteps.cadenceId, cadenceId), eq(cadenceSteps.stepIndex, 0)))
    .limit(1)
    .then((r) => r[0]);

  if (!step0) {
    throw new Error("Cadence must have step 0");
  }

  const now = new Date();
  const nextStepDueAt = new Date(now);
  nextStepDueAt.setDate(nextStepDueAt.getDate() + (step0.delay ?? 0));

  await db.insert(leadCadenceEnrollments).values({
    leadId,
    cadenceId,
    currentStepIndex: 0,
    nextStepDueAt
  });

  revalidatePath(`/cadences/${cadenceId}`);
}

async function markStepSent(enrollmentId: string) {
  "use server";

  const db = getDb();

  const enrollment = await db
    .select({
      id: leadCadenceEnrollments.id,
      cadenceId: leadCadenceEnrollments.cadenceId,
      leadId: leadCadenceEnrollments.leadId,
      currentStepIndex: leadCadenceEnrollments.currentStepIndex,
      completedAt: leadCadenceEnrollments.completedAt
    })
    .from(leadCadenceEnrollments)
    .where(eq(leadCadenceEnrollments.id, enrollmentId))
    .limit(1)
    .then((r) => r[0]);

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  if (enrollment.completedAt) {
    return;
  }

  const now = new Date();

  const currentStep = await db
    .select({
      id: cadenceSteps.id,
      subjectTemplate: cadenceSteps.subjectTemplate,
      bodyTemplate: cadenceSteps.bodyTemplate
    })
    .from(cadenceSteps)
    .where(
      and(
        eq(cadenceSteps.cadenceId, enrollment.cadenceId),
        eq(cadenceSteps.stepIndex, enrollment.currentStepIndex)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!currentStep) {
    throw new Error("Current step not found");
  }

  const lead = await db
    .select({
      primaryEmail: leads.primaryEmail,
      status: leads.status
    })
    .from(leads)
    .where(eq(leads.id, enrollment.leadId))
    .limit(1)
    .then((r) => r[0]);

  const toEmail = lead?.primaryEmail ?? `${enrollment.leadId}@no-email.local`;

  await db.insert(emailActivities).values({
    leadId: enrollment.leadId,
    direction: "outbound",
    toEmail,
    subject: currentStep.subjectTemplate,
    body: currentStep.bodyTemplate,
    cadenceEnrollmentId: enrollment.id,
    cadenceStepId: currentStep.id,
    sentAt: now,
    metadata: {
      source: "manual-cadence"
    }
  });

  await db
    .update(leads)
    .set({
      lastContactedAt: now,
      status: lead?.status === "new" ? "contacted" : lead?.status,
      updatedAt: now
    })
    .where(eq(leads.id, enrollment.leadId));

  const nextIndex = enrollment.currentStepIndex + 1;

  const nextStep = await db
    .select({
      delay: cadenceSteps.delayDaysFromPrevious
    })
    .from(cadenceSteps)
    .where(and(eq(cadenceSteps.cadenceId, enrollment.cadenceId), eq(cadenceSteps.stepIndex, nextIndex)))
    .limit(1)
    .then((r) => r[0]);

  if (!nextStep) {
    await db
      .update(leadCadenceEnrollments)
      .set({
        currentStepIndex: nextIndex,
        nextStepDueAt: null,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(leadCadenceEnrollments.id, enrollmentId));

    revalidatePath("/cadences");
    return;
  }

  const nextStepDueAt = new Date(now);
  nextStepDueAt.setDate(nextStepDueAt.getDate() + (nextStep.delay ?? 0));

  await db
    .update(leadCadenceEnrollments)
    .set({
      currentStepIndex: nextIndex,
      nextStepDueAt,
      updatedAt: new Date()
    })
    .where(eq(leadCadenceEnrollments.id, enrollmentId));

  revalidatePath("/cadences");
}

export default async function CadenceDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = getDb();

  const cadence = await db
    .select({
      id: cadences.id,
      name: cadences.name,
      description: cadences.description,
      isActive: cadences.isActive,
      createdAt: cadences.createdAt,
      updatedAt: cadences.updatedAt
    })
    .from(cadences)
    .where(eq(cadences.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!cadence) {
    notFound();
  }

  const steps = await db
    .select({
      id: cadenceSteps.id,
      stepIndex: cadenceSteps.stepIndex,
      delayDaysFromPrevious: cadenceSteps.delayDaysFromPrevious,
      subjectTemplate: cadenceSteps.subjectTemplate,
      bodyTemplate: cadenceSteps.bodyTemplate
    })
    .from(cadenceSteps)
    .where(eq(cadenceSteps.cadenceId, id))
    .orderBy(asc(cadenceSteps.stepIndex));

  const enrollments = await db
    .select({
      id: leadCadenceEnrollments.id,
      leadId: leadCadenceEnrollments.leadId,
      leadName: leads.name,
      leadCompany: leads.company,
      currentStepIndex: leadCadenceEnrollments.currentStepIndex,
      nextStepDueAt: leadCadenceEnrollments.nextStepDueAt,
      completedAt: leadCadenceEnrollments.completedAt,
      enrolledAt: leadCadenceEnrollments.enrolledAt
    })
    .from(leadCadenceEnrollments)
    .innerJoin(leads, eq(leadCadenceEnrollments.leadId, leads.id))
    .where(eq(leadCadenceEnrollments.cadenceId, id))
    .orderBy(desc(leadCadenceEnrollments.enrolledAt))
    .limit(200);

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{cadence.name}</h1>
          <div style={{ color: "#475569", fontSize: 14 }}>
            {cadence.isActive ? "active" : "inactive"}
          </div>
        </div>
        <div>
          <Link className="navLink" href="/cadences">
            Back to cadences
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Edit cadence</h2>
        <form action={updateCadence.bind(null, cadence.id)}>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Name
              <input
                name="name"
                defaultValue={cadence.name}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Description
              <input
                name="description"
                defaultValue={cadence.description ?? ""}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              <input name="isActive" type="checkbox" defaultChecked={cadence.isActive} /> Active
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Steps</h2>
        {steps.length === 0 ? (
          <p>No steps yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {steps.map((s) => (
              <div key={s.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="cardTitle">Step {s.stepIndex}</div>
                    <p className="cardDesc">Delay: {s.delayDaysFromPrevious} days</p>
                    <p className="cardDesc">Subject: {s.subjectTemplate}</p>
                  </div>
                  <form action={deleteStep.bind(null, cadence.id, s.id)}>
                    <button type="submit">Delete step</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Add step</h3>
          <form action={addStep.bind(null, cadence.id)}>
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                Step index
                <input
                  name="stepIndex"
                  type="number"
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Delay days from previous
                <input
                  name="delayDaysFromPrevious"
                  type="number"
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Subject template
                <input
                  name="subjectTemplate"
                  style={{ display: "block", marginTop: 6, width: "100%" }}
                />
              </label>
              <label>
                Body template
                <textarea
                  name="bodyTemplate"
                  style={{ display: "block", marginTop: 6, width: "100%", minHeight: 100 }}
                />
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="submit">Add</button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Enrollments</h2>

        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Enroll lead</h3>
          <form action={enrollLead.bind(null, cadence.id)}>
            <label>
              Lead
              <select name="leadId" defaultValue="" style={{ display: "block", marginTop: 6 }}>
                <option value="">Select a lead</option>
                {leadOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name ?? l.company ?? l.id}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ marginTop: 12 }}>
              <button type="submit">Enroll</button>
            </div>
          </form>
        </div>

        {enrollments.length === 0 ? (
          <p>No enrollments yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {enrollments.map((e) => (
              <div key={e.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="cardTitle">
                      {e.leadName ?? e.leadCompany ?? e.leadId}
                    </div>
                    <p className="cardDesc">Current step: {e.currentStepIndex}</p>
                    <p className="cardDesc">
                      Next due: {e.nextStepDueAt ? e.nextStepDueAt.toISOString() : ""}
                    </p>
                    <p className="cardDesc">
                      {e.completedAt ? "Completed" : "Active"}
                    </p>
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <Link className="navLink" href={`/leads/${e.leadId}`}>
                      Open lead
                    </Link>
                    {!e.completedAt ? (
                      <form action={markStepSent.bind(null, e.id)}>
                        <button type="submit">Mark due step sent</button>
                      </form>
                    ) : null}
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
