CREATE TYPE "public"."company_stage" AS ENUM('dead-lead', 'contacted', 'evaluating-proposal', 'trial-30-day', 'client');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"stage" "company_stage" DEFAULT 'dead-lead' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_invoiced" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_stage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"from_stage" "company_stage",
	"to_stage" "company_stage" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"strategy_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_strategy_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_email_step_index" integer DEFAULT 0 NOT NULL,
	"next_outreach_due_at" timestamp with time zone,
	"last_acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"price_per_month_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"day_offset" integer DEFAULT 0 NOT NULL,
	"subject_template" text NOT NULL,
	"body_template" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "line_contract_id" uuid;--> statement-breakpoint
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_lines" ADD CONSTRAINT "company_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_stage_events" ADD CONSTRAINT "company_stage_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_stage_events" ADD CONSTRAINT "company_stage_events_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_strategy_assignments" ADD CONSTRAINT "company_strategy_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_strategy_assignments" ADD CONSTRAINT "company_strategy_assignments_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_contracts" ADD CONSTRAINT "line_contracts_line_id_company_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."company_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_emails" ADD CONSTRAINT "strategy_emails_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "companies_stage_idx" ON "companies" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "company_contacts_company_id_idx" ON "company_contacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_lines_company_id_idx" ON "company_lines" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_stage_events_company_id_idx" ON "company_stage_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_stage_events_occurred_at_idx" ON "company_stage_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_strategy_assignments_company_id_unique" ON "company_strategy_assignments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_strategy_assignments_next_outreach_due_at_idx" ON "company_strategy_assignments" USING btree ("next_outreach_due_at");--> statement-breakpoint
CREATE INDEX "line_contracts_line_id_idx" ON "line_contracts" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "line_contracts_end_date_idx" ON "line_contracts" USING btree ("end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "strategies_name_unique" ON "strategies" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "strategy_emails_strategy_id_step_index_unique" ON "strategy_emails" USING btree ("strategy_id","step_index");--> statement-breakpoint
CREATE INDEX "strategy_emails_strategy_id_idx" ON "strategy_emails" USING btree ("strategy_id");--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_line_contract_id_line_contracts_id_fk" FOREIGN KEY ("line_contract_id") REFERENCES "public"."line_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminders_company_id_idx" ON "reminders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "reminders_line_contract_id_idx" ON "reminders" USING btree ("line_contract_id");