ALTER TABLE "reminders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_idempotency_key_unique" ON "reminders" USING btree ("idempotency_key");