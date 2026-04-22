import "server-only";

import { getDb } from "@/db";
import {
  cadenceSteps,
  cadences,
  clients,
  emailActivities,
  leadCadenceEnrollments,
  leads,
  licenses,
  reminders
} from "@/db/schema";

export async function seedDatabase() {
  const db = getDb();
  const now = new Date();

  const leadAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d01";
  const leadBId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d02";
  const clientAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d03";
  const licenseAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d04";
  const cadenceAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d05";
  const cadenceStep0Id = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d06";
  const cadenceStep1Id = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d07";
  const enrollmentAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d08";
  const reminderAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d09";
  const reminderBId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d0a";
  const emailActivityAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d0b";

  await db
    .insert(leads)
    .values([
      {
        id: leadAId,
        name: "Alex Example",
        company: "Example Co",
        primaryEmail: "alex@example.com",
        secondaryEmails: [],
        phone: "+1 555 0100",
        website: "https://example.com",
        source: "seed",
        status: "new",
        tags: ["seed"],
        notes: "Sample lead for local development"
      },
      {
        id: leadBId,
        name: "Taylor Prospect",
        company: "Prospect LLC",
        primaryEmail: "taylor@prospect.test",
        secondaryEmails: [],
        phone: "+1 555 0101",
        website: "https://prospect.test",
        source: "seed",
        status: "contacted",
        tags: ["seed"],
        notes: "Another sample lead"
      }
    ])
    .onConflictDoNothing({ target: leads.id });

  await db
    .insert(clients)
    .values({
      id: clientAId,
      name: "Acme Corp",
      primaryContactEmail: "ops@acme.test",
      notes: "Sample client for renewal tracking"
    })
    .onConflictDoNothing({ target: clients.id });

  await db
    .insert(licenses)
    .values({
      id: licenseAId,
      clientId: clientAId,
      productName: "Acme Platform",
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90),
      renewalDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
      renewalCadence: "annual",
      status: "active"
    })
    .onConflictDoNothing({ target: licenses.id });

  await db
    .insert(cadences)
    .values({
      id: cadenceAId,
      name: "Cold outreach v1",
      description: "Two-step cadence for initial outreach",
      isActive: true
    })
    .onConflictDoNothing({ target: cadences.id });

  await db
    .insert(cadenceSteps)
    .values([
      {
        id: cadenceStep0Id,
        cadenceId: cadenceAId,
        stepIndex: 0,
        delayDaysFromPrevious: 0,
        subjectTemplate: "Quick question, {{company}}",
        bodyTemplate:
          "Hi {{name}},\n\nWanted to reach out and see if you have 10 minutes this week.\n\nBest,\nLukas"
      },
      {
        id: cadenceStep1Id,
        cadenceId: cadenceAId,
        stepIndex: 1,
        delayDaysFromPrevious: 3,
        subjectTemplate: "Following up, {{company}}",
        bodyTemplate:
          "Hi {{name}},\n\nJust following up on my last note.\n\nBest,\nLukas"
      }
    ])
    .onConflictDoNothing({ target: cadenceSteps.id });

  await db
    .insert(leadCadenceEnrollments)
    .values({
      id: enrollmentAId,
      leadId: leadAId,
      cadenceId: cadenceAId,
      currentStepIndex: 0,
      nextStepDueAt: now
    })
    .onConflictDoNothing({ target: leadCadenceEnrollments.id });

  await db
    .insert(reminders)
    .values([
      {
        id: reminderAId,
        title: "Send cadence step 0",
        dueAt: now,
        leadId: leadAId,
        status: "open"
      },
      {
        id: reminderBId,
        title: "Renewal outreach (30 days)",
        dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1),
        licenseId: licenseAId,
        status: "open"
      }
    ])
    .onConflictDoNothing({ target: reminders.id });

  await db
    .insert(emailActivities)
    .values({
      id: emailActivityAId,
      leadId: leadBId,
      direction: "outbound",
      fromEmail: "me@local.test",
      toEmail: "taylor@prospect.test",
      subject: "Intro",
      body: "Hello from Lead Manager seed data",
      sentAt: now,
      metadata: {
        source: "seed"
      }
    })
    .onConflictDoNothing({ target: emailActivities.id });

  return {
    leadAId,
    leadBId,
    clientAId,
    licenseAId,
    cadenceAId,
    enrollmentAId
  };
}
