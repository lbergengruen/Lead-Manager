CREATE TABLE "renewal_reminder_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"days_before_renewal" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "renewal_reminder_windows_days_unique" ON "renewal_reminder_windows" USING btree ("days_before_renewal");