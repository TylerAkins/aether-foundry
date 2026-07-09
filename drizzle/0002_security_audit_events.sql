CREATE TABLE "security_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_employee_account_id" uuid,
	"actor_global_role" "employee_global_role",
	"action" text NOT NULL,
	"outcome" text NOT NULL,
	"target_employee_account_id" uuid,
	"request_context" jsonb NOT NULL,
	"details" jsonb NOT NULL,
	"previous_event_hash" text,
	"event_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "security_audit_events_action_not_blank" CHECK (length(trim("security_audit_events"."action")) > 0),
	CONSTRAINT "security_audit_events_outcome_not_blank" CHECK (length(trim("security_audit_events"."outcome")) > 0)
);
--> statement-breakpoint
CREATE INDEX "security_audit_events_created_at_idx" ON "security_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "security_audit_events_actor_employee_account_id_idx" ON "security_audit_events" USING btree ("actor_employee_account_id");--> statement-breakpoint
CREATE INDEX "security_audit_events_target_employee_account_id_idx" ON "security_audit_events" USING btree ("target_employee_account_id");--> statement-breakpoint
CREATE INDEX "security_audit_events_action_idx" ON "security_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "security_audit_events_outcome_idx" ON "security_audit_events" USING btree ("outcome");
