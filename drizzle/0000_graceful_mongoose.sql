CREATE TYPE "public"."email_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'awaiting-reply', 'follow-up-needed', 'in-discussion', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."license_renewal_cadence" AS ENUM('annual', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."license_status" AS ENUM('active', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('open', 'done', 'canceled');--> statement-breakpoint
CREATE TABLE "cadence_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cadence_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"delay_days_from_previous" integer DEFAULT 0 NOT NULL,
	"subject_template" text NOT NULL,
	"body_template" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"primary_contact_email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"client_id" uuid,
	"license_id" uuid,
	"direction" "email_direction" DEFAULT 'outbound' NOT NULL,
	"from_email" text,
	"to_email" text NOT NULL,
	"subject" text,
	"body" text,
	"external_message_id" text,
	"cadence_enrollment_id" uuid,
	"cadence_step_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_cadence_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"cadence_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"next_step_due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"company" text,
	"primary_email" text,
	"secondary_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"phone" text,
	"website" text,
	"source" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"next_action_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"renewal_date" timestamp with time zone NOT NULL,
	"renewal_cadence" "license_renewal_cadence" DEFAULT 'annual' NOT NULL,
	"status" "license_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"lead_id" uuid,
	"license_id" uuid,
	"status" "reminder_status" DEFAULT 'open' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cadence_steps" ADD CONSTRAINT "cadence_steps_cadence_id_cadences_id_fk" FOREIGN KEY ("cadence_id") REFERENCES "public"."cadences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_activities" ADD CONSTRAINT "email_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_activities" ADD CONSTRAINT "email_activities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_activities" ADD CONSTRAINT "email_activities_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_activities" ADD CONSTRAINT "email_activities_cadence_enrollment_id_lead_cadence_enrollments_id_fk" FOREIGN KEY ("cadence_enrollment_id") REFERENCES "public"."lead_cadence_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_activities" ADD CONSTRAINT "email_activities_cadence_step_id_cadence_steps_id_fk" FOREIGN KEY ("cadence_step_id") REFERENCES "public"."cadence_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_cadence_enrollments" ADD CONSTRAINT "lead_cadence_enrollments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_cadence_enrollments" ADD CONSTRAINT "lead_cadence_enrollments_cadence_id_cadences_id_fk" FOREIGN KEY ("cadence_id") REFERENCES "public"."cadences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cadence_steps_cadence_id_step_index_unique" ON "cadence_steps" USING btree ("cadence_id","step_index");--> statement-breakpoint
CREATE INDEX "cadence_steps_cadence_id_idx" ON "cadence_steps" USING btree ("cadence_id");--> statement-breakpoint
CREATE INDEX "cadences_name_idx" ON "cadences" USING btree ("name");--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "email_activities_lead_id_idx" ON "email_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "email_activities_client_id_idx" ON "email_activities" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "email_activities_sent_at_idx" ON "email_activities" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_activities_external_message_id_idx" ON "email_activities" USING btree ("external_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_cadence_enrollments_lead_id_cadence_id_unique" ON "lead_cadence_enrollments" USING btree ("lead_id","cadence_id");--> statement-breakpoint
CREATE INDEX "lead_cadence_enrollments_next_step_due_at_idx" ON "lead_cadence_enrollments" USING btree ("next_step_due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_primary_email_unique" ON "leads" USING btree ("primary_email");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_company_idx" ON "leads" USING btree ("company");--> statement-breakpoint
CREATE INDEX "leads_name_idx" ON "leads" USING btree ("name");--> statement-breakpoint
CREATE INDEX "licenses_client_id_idx" ON "licenses" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "licenses_renewal_date_idx" ON "licenses" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "reminders_due_at_idx" ON "reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "reminders_status_idx" ON "reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reminders_lead_id_idx" ON "reminders" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "reminders_license_id_idx" ON "reminders" USING btree ("license_id");