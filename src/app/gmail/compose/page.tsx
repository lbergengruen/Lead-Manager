import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/db";
import { emailActivities, leadCadenceEnrollments, leads, cadenceSteps } from "@/db/schema";
import { env } from "@/env";
import { isGoogleConnected } from "@/gmail/oauth";
import { sendGmail } from "@/gmail/send";

export const dynamic = "force-dynamic";

async function sendEmail(formData: FormData) {
  "use server";

  if (!env.gmailEnabled) {
    throw new Error("Gmail is disabled");
  }

  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "on") {
    throw new Error("Confirmation required");
  }

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!enrollmentId || !to || !subject || !body) {
    throw new Error("Missing fields");
  }

  const db = getDb();
  const enrollment = await db
    .select({
      id: leadCadenceEnrollments.id,
      leadId: leadCadenceEnrollments.leadId,
      cadenceId: leadCadenceEnrollments.cadenceId,
      currentStepIndex: leadCadenceEnrollments.currentStepIndex
    })
    .from(leadCadenceEnrollments)
    .where(eq(leadCadenceEnrollments.id, enrollmentId))
    .limit(1)
    .then((r) => r[0]);

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  const step = await db
    .select({ id: cadenceSteps.id })
    .from(cadenceSteps)
    .where(
      and(
        eq(cadenceSteps.cadenceId, enrollment.cadenceId),
        eq(cadenceSteps.stepIndex, enrollment.currentStepIndex)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  const sent = await sendGmail({ to, subject, body });

  await db.insert(emailActivities).values({
    leadId: enrollment.leadId,
    direction: "outbound",
    toEmail: to,
    subject,
    body,
    cadenceEnrollmentId: enrollment.id,
    cadenceStepId: step?.id,
    sentAt: new Date(),
    metadata: {
      source: "gmail",
      gmailMessageId: sent.id,
      gmailThreadId: sent.threadId
    }
  });

  revalidatePath("/cadences");
  redirect(`/cadences/${enrollment.cadenceId}`);
}

export default async function GmailComposePage({
  searchParams
}: {
  searchParams?: Promise<{ enrollmentId?: string }>;
}) {
  const sp = await searchParams;
  const enrollmentId = String(sp?.enrollmentId ?? "").trim();

  if (!env.gmailEnabled) {
    return (
      <div>
        <h1>Compose</h1>
        <p>Gmail integration is disabled.</p>
      </div>
    );
  }

  const connected = await isGoogleConnected();
  if (!connected) {
    return (
      <div>
        <h1>Compose</h1>
        <p>Gmail is not connected.</p>
        <Link className="navLink" href="/settings">
          Go to settings
        </Link>
      </div>
    );
  }

  if (!enrollmentId) {
    return (
      <div>
        <h1>Compose</h1>
        <p>Missing enrollmentId.</p>
      </div>
    );
  }

  const db = getDb();
  const enrollment = await db
    .select({
      id: leadCadenceEnrollments.id,
      leadId: leadCadenceEnrollments.leadId,
      cadenceId: leadCadenceEnrollments.cadenceId,
      currentStepIndex: leadCadenceEnrollments.currentStepIndex
    })
    .from(leadCadenceEnrollments)
    .where(eq(leadCadenceEnrollments.id, enrollmentId))
    .limit(1)
    .then((r) => r[0]);

  if (!enrollment) {
    notFound();
  }

  const lead = await db
    .select({
      name: leads.name,
      company: leads.company,
      primaryEmail: leads.primaryEmail
    })
    .from(leads)
    .where(eq(leads.id, enrollment.leadId))
    .limit(1)
    .then((r) => r[0]);

  const step = await db
    .select({
      subject: cadenceSteps.subjectTemplate,
      body: cadenceSteps.bodyTemplate
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

  if (!step) {
    notFound();
  }

  const subject = step.subject;
  const body = step.body;

  const to = lead?.primaryEmail ?? "";

  return (
    <div>
      <h1>Compose</h1>
      <p className="cardDesc">
        Lead: {lead?.name ?? lead?.company ?? enrollment.leadId}
      </p>

      <div className="card" style={{ marginTop: 12 }}>
        <form action={sendEmail}>
          <input type="hidden" name="enrollmentId" value={enrollment.id} />

          <div style={{ display: "grid", gap: 10 }}>
            <label>
              To
              <input
                name="to"
                defaultValue={to}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Subject
              <input
                name="subject"
                defaultValue={subject}
                style={{ display: "block", marginTop: 6, width: "100%" }}
              />
            </label>

            <label>
              Body
              <textarea
                name="body"
                defaultValue={body}
                style={{ display: "block", marginTop: 6, width: "100%", minHeight: 200 }}
              />
            </label>

            <label>
              <input name="confirm" type="checkbox" /> Confirm send
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}
