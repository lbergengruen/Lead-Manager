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

export async function seedDatabaseCore(db: any) {
  const now = new Date();

  const leadAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d01";
  const leadBId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d02";
  const leadCId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d0c";
  const leadDId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d0d";
  const leadEId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d0e";
  const clientAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d03";
  const clientBId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d0f";
  const clientCId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d10";
  const licenseAId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d04";
  const licenseBId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d11";
  const licenseCId = "2f48833d-8071-4bcf-8e9f-8dc71f0b7d12";
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
      },
      {
        id: leadCId,
        name: "Jordan Buyer",
        company: "Bluebird Inc",
        primaryEmail: "jordan@bluebird.test",
        secondaryEmails: [],
        phone: "+1 555 0102",
        website: "https://bluebird.test",
        source: "seed",
        status: "awaiting-reply",
        tags: ["seed"],
        notes: "Waiting for response"
      },
      {
        id: leadDId,
        name: "Sam Decision",
        company: "Northwind Traders",
        primaryEmail: "sam@northwind.test",
        secondaryEmails: [],
        phone: "+1 555 0103",
        website: "https://northwind.test",
        source: "seed",
        status: "in-discussion",
        tags: ["seed"],
        notes: "In discussion stage"
      },
      {
        id: leadEId,
        name: "Casey Quiet",
        company: "Silent Studio",
        primaryEmail: "casey@silent.test",
        secondaryEmails: [],
        phone: "+1 555 0104",
        website: "https://silent.test",
        source: "seed",
        status: "new",
        tags: ["seed"],
        notes: "Fresh inbound"
      }
    ])
    .onConflictDoNothing({ target: leads.id });

  await db
    .insert(clients)
    .values([
      {
        id: clientAId,
        name: "Acme Corp",
        primaryContactEmail: "ops@acme.test",
        notes: "Sample client for renewal tracking"
      },
      {
        id: clientBId,
        name: "Globex",
        primaryContactEmail: "finance@globex.test",
        notes: "Second sample client"
      },
      {
        id: clientCId,
        name: "Initech",
        primaryContactEmail: "it@initech.test",
        notes: "Third sample client"
      }
    ])
    .onConflictDoNothing({ target: clients.id });

  await db
    .insert(licenses)
    .values([
      {
        id: licenseAId,
        clientId: clientAId,
        productName: "Acme Platform",
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90),
        renewalDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
        renewalCadence: "annual",
        status: "active"
      },
      {
        id: licenseBId,
        clientId: clientBId,
        productName: "Globex Suite",
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60),
        renewalDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 45),
        renewalCadence: "annual",
        status: "active"
      },
      {
        id: licenseCId,
        clientId: clientCId,
        productName: "Initech Core",
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
        renewalDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 15),
        renewalCadence: "annual",
        status: "active"
      }
    ])
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
        bodyTemplate: "Hi {{name}},\n\nJust following up on my last note.\n\nBest,\nLukas"
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
    leadCId,
    leadDId,
    leadEId,
    clientAId,
    clientBId,
    clientCId,
    licenseAId,
    licenseBId,
    licenseCId,
    cadenceAId,
    enrollmentAId
  };
}
