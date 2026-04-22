import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "awaiting-reply",
  "follow-up-needed",
  "in-discussion",
  "won",
  "lost"
]);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "open",
  "done",
  "canceled"
]);

export const licenseStatusEnum = pgEnum("license_status", [
  "active",
  "canceled",
  "expired"
]);

export const licenseRenewalCadenceEnum = pgEnum("license_renewal_cadence", [
  "annual",
  "monthly",
  "custom"
]);

export const emailDirectionEnum = pgEnum("email_direction", [
  "outbound",
  "inbound"
]);

export const companyStageEnum = pgEnum("company_stage", [
  "dead-lead",
  "contacted",
  "evaluating-proposal",
  "trial-30-day",
  "client"
]);

export const renewalReminderWindows = pgTable(
  "renewal_reminder_windows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    daysBeforeRenewal: integer("days_before_renewal").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    daysUnique: uniqueIndex("renewal_reminder_windows_days_unique").on(t.daysBeforeRenewal)
  })
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),
    notes: text("notes"),
    commissionPercentage: integer("commission_percentage").notNull().default(0),

    stage: companyStageEnum("stage").notNull().default("dead-lead"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    nameUnique: uniqueIndex("companies_name_unique").on(t.name),
    nameIdx: index("companies_name_idx").on(t.name),
    stageIdx: index("companies_stage_idx").on(t.stage)
  })
);

export const companyContacts = pgTable(
  "company_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
    isPrimary: boolean("is_primary").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    companyIdx: index("company_contacts_company_id_idx").on(t.companyId)
  })
);

export const strategies = pgTable(
  "strategies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    nameUnique: uniqueIndex("strategies_name_unique").on(t.name)
  })
);

export const strategyEmails = pgTable(
  "strategy_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    strategyId: uuid("strategy_id")
      .notNull()
      .references(() => strategies.id, { onDelete: "cascade" }),

    stepIndex: integer("step_index").notNull(),
    dayOffset: integer("day_offset").notNull().default(0),
    subjectTemplate: text("subject_template").notNull(),
    bodyTemplate: text("body_template").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    strategyStepUnique: uniqueIndex("strategy_emails_strategy_id_step_index_unique").on(
      t.strategyId,
      t.stepIndex
    ),
    strategyIdx: index("strategy_emails_strategy_id_idx").on(t.strategyId)
  })
);

export const companyStrategyAssignments = pgTable(
  "company_strategy_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    strategyId: uuid("strategy_id")
      .notNull()
      .references(() => strategies.id, { onDelete: "cascade" }),

    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    currentEmailStepIndex: integer("current_email_step_index").notNull().default(0),
    nextOutreachDueAt: timestamp("next_outreach_due_at", { withTimezone: true }),
    lastAcknowledgedAt: timestamp("last_acknowledged_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    companyUnique: uniqueIndex("company_strategy_assignments_company_id_unique").on(t.companyId),
    nextOutreachDueAtIdx: index("company_strategy_assignments_next_outreach_due_at_idx").on(
      t.nextOutreachDueAt
    )
  })
);

export const companyLines = pgTable(
  "company_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    isInvoiced: boolean("is_invoiced").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    companyIdx: index("company_lines_company_id_idx").on(t.companyId)
  })
);

export const lineContracts = pgTable(
  "line_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    lineId: uuid("line_id")
      .notNull()
      .references(() => companyLines.id, { onDelete: "cascade" }),

    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    pricePerMonthCents: integer("price_per_month_cents").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    lineIdx: index("line_contracts_line_id_idx").on(t.lineId),
    endDateIdx: index("line_contracts_end_date_idx").on(t.endDate)
  })
);

export const companyStageEvents = pgTable(
  "company_stage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    fromStage: companyStageEnum("from_stage"),
    toStage: companyStageEnum("to_stage").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    strategyId: uuid("strategy_id").references(() => strategies.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    companyIdx: index("company_stage_events_company_id_idx").on(t.companyId),
    occurredAtIdx: index("company_stage_events_occurred_at_idx").on(t.occurredAt)
  })
);

export const oauthCredentials = pgTable(
  "oauth_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    encryptedTokens: text("encrypted_tokens").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    providerUnique: uniqueIndex("oauth_credentials_provider_unique").on(t.provider)
  })
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name"),
    company: text("company"),

    primaryEmail: text("primary_email"),
    secondaryEmails: jsonb("secondary_emails").$type<string[]>().notNull().default([]),

    phone: text("phone"),
    website: text("website"),
    source: text("source"),

    status: leadStatusEnum("status").notNull().default("new"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),

    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (t) => {
    return {
      primaryEmailUnique: uniqueIndex("leads_primary_email_unique").on(t.primaryEmail),
      statusIdx: index("leads_status_idx").on(t.status),
      companyIdx: index("leads_company_idx").on(t.company),
      nameIdx: index("leads_name_idx").on(t.name)
    };
  }
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    primaryContactEmail: text("primary_contact_email"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    nameIdx: index("clients_name_idx").on(t.name)
  })
);

export const licenses = pgTable(
  "licenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    productName: text("product_name").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    renewalDate: timestamp("renewal_date", { withTimezone: true }).notNull(),

    renewalCadence: licenseRenewalCadenceEnum("renewal_cadence")
      .notNull()
      .default("annual"),

    status: licenseStatusEnum("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    clientIdx: index("licenses_client_id_idx").on(t.clientId),
    renewalDateIdx: index("licenses_renewal_date_idx").on(t.renewalDate)
  })
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    idempotencyKey: text("idempotency_key"),

    title: text("title").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),

    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    licenseId: uuid("license_id").references(() => licenses.id, { onDelete: "set null" }),

    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    lineContractId: uuid("line_contract_id").references(() => lineContracts.id, {
      onDelete: "set null"
    }),

    status: reminderStatusEnum("status").notNull().default("open"),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    idempotencyKeyUnique: uniqueIndex("reminders_idempotency_key_unique").on(t.idempotencyKey),
    dueAtIdx: index("reminders_due_at_idx").on(t.dueAt),
    statusIdx: index("reminders_status_idx").on(t.status),
    leadIdx: index("reminders_lead_id_idx").on(t.leadId),
    licenseIdx: index("reminders_license_id_idx").on(t.licenseId),
    companyIdx: index("reminders_company_id_idx").on(t.companyId),
    lineContractIdx: index("reminders_line_contract_id_idx").on(t.lineContractId)
  })
);

export const cadences = pgTable(
  "cadences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    nameIdx: index("cadences_name_idx").on(t.name)
  })
);

export const cadenceSteps = pgTable(
  "cadence_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    cadenceId: uuid("cadence_id")
      .notNull()
      .references(() => cadences.id, { onDelete: "cascade" }),

    stepIndex: integer("step_index").notNull(),
    delayDaysFromPrevious: integer("delay_days_from_previous").notNull().default(0),

    subjectTemplate: text("subject_template").notNull(),
    bodyTemplate: text("body_template").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    cadenceStepUnique: uniqueIndex("cadence_steps_cadence_id_step_index_unique").on(
      t.cadenceId,
      t.stepIndex
    ),
    cadenceIdx: index("cadence_steps_cadence_id_idx").on(t.cadenceId)
  })
);

export const leadCadenceEnrollments = pgTable(
  "lead_cadence_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),

    cadenceId: uuid("cadence_id")
      .notNull()
      .references(() => cadences.id, { onDelete: "cascade" }),

    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    pausedAt: timestamp("paused_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    currentStepIndex: integer("current_step_index").notNull().default(0),
    nextStepDueAt: timestamp("next_step_due_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    enrollmentUnique: uniqueIndex("lead_cadence_enrollments_lead_id_cadence_id_unique").on(
      t.leadId,
      t.cadenceId
    ),
    nextStepDueAtIdx: index("lead_cadence_enrollments_next_step_due_at_idx").on(
      t.nextStepDueAt
    )
  })
);

export const emailActivities = pgTable(
  "email_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    licenseId: uuid("license_id").references(() => licenses.id, { onDelete: "set null" }),

    direction: emailDirectionEnum("direction").notNull().default("outbound"),

    fromEmail: text("from_email"),
    toEmail: text("to_email").notNull(),

    subject: text("subject"),
    body: text("body"),

    externalMessageId: text("external_message_id"),

    cadenceEnrollmentId: uuid("cadence_enrollment_id").references(
      () => leadCadenceEnrollments.id,
      { onDelete: "set null" }
    ),
    cadenceStepId: uuid("cadence_step_id").references(() => cadenceSteps.id, {
      onDelete: "set null"
    }),

    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({})
  },
  (t) => ({
    leadIdx: index("email_activities_lead_id_idx").on(t.leadId),
    clientIdx: index("email_activities_client_id_idx").on(t.clientId),
    sentAtIdx: index("email_activities_sent_at_idx").on(t.sentAt),
    externalMessageIdIdx: index("email_activities_external_message_id_idx").on(
      t.externalMessageId
    )
  })
);
