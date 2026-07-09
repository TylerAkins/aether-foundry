CREATE TYPE "public"."employee_global_role" AS ENUM('owner', 'system_admin', 'employee');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('pending', 'active', 'suspended', 'terminated');--> statement-breakpoint
CREATE TABLE "employee_product_access" (
	"employee_account_id" uuid NOT NULL,
	"product_key" text NOT NULL,
	"product_role" text NOT NULL,
	"launch_access_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_product_access_pk" PRIMARY KEY("employee_account_id","product_key"),
	CONSTRAINT "employee_product_access_product_key_not_blank" CHECK (length(trim("employee_product_access"."product_key")) > 0),
	CONSTRAINT "employee_product_access_product_role_not_blank" CHECK (length(trim("employee_product_access"."product_role")) > 0)
);
--> statement-breakpoint
ALTER TABLE "employee_accounts" RENAME COLUMN "email" TO "company_email";--> statement-breakpoint
ALTER TABLE "employee_accounts" RENAME COLUMN "role" TO "global_role";--> statement-breakpoint
DROP INDEX "employee_accounts_email_idx";--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "global_role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "global_role" SET DATA TYPE "public"."employee_global_role" USING (
	CASE
		WHEN "global_role" IN ('owner', 'system_admin', 'employee') THEN "global_role"
		ELSE 'employee'
	END
)::"public"."employee_global_role";--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "global_role" SET DEFAULT 'employee'::"public"."employee_global_role";--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "status" SET DATA TYPE "public"."employee_status" USING (
	CASE
		WHEN "status" = 'disabled' THEN 'suspended'
		WHEN "status" IN ('pending', 'active', 'suspended', 'terminated') THEN "status"
		ELSE 'pending'
	END
)::"public"."employee_status";--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."employee_status";--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "personal_email" text;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD COLUMN "github_url" text;--> statement-breakpoint
UPDATE "employee_accounts"
SET
	"personal_email" = COALESCE(NULLIF(trim("personal_email"), ''), "company_email"),
	"first_name" = COALESCE(NULLIF(trim("first_name"), ''), 'Unknown'),
	"last_name" = COALESCE(NULLIF(trim("last_name"), ''), 'Employee'),
	"phone" = COALESCE(NULLIF(trim("phone"), ''), 'unknown'),
	"github_url" = COALESCE(NULLIF(trim("github_url"), ''), 'https://github.com/unknown');--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "personal_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_accounts" ALTER COLUMN "github_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_product_access" ADD CONSTRAINT "employee_product_access_employee_account_id_employee_accounts_id_fk" FOREIGN KEY ("employee_account_id") REFERENCES "public"."employee_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_product_access_employee_account_id_idx" ON "employee_product_access" USING btree ("employee_account_id");--> statement-breakpoint
CREATE INDEX "employee_product_access_product_key_idx" ON "employee_product_access" USING btree ("product_key");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_accounts_company_email_idx" ON "employee_accounts" USING btree ("company_email");--> statement-breakpoint
CREATE INDEX "employee_accounts_status_idx" ON "employee_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_accounts_global_role_idx" ON "employee_accounts" USING btree ("global_role");--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_company_email_not_blank" CHECK (length(trim("employee_accounts"."company_email")) > 0);--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_personal_email_not_blank" CHECK (length(trim("employee_accounts"."personal_email")) > 0);--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_first_name_not_blank" CHECK (length(trim("employee_accounts"."first_name")) > 0);--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_last_name_not_blank" CHECK (length(trim("employee_accounts"."last_name")) > 0);--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_phone_not_blank" CHECK (length(trim("employee_accounts"."phone")) > 0);--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_github_url_not_blank" CHECK (length(trim("employee_accounts"."github_url")) > 0);
