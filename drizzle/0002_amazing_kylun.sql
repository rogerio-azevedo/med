CREATE TYPE "public"."invite_role" AS ENUM('doctor', 'patient');--> statement-breakpoint
CREATE TABLE "invite_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"clinic_id" uuid NOT NULL,
	"role" "invite_role" NOT NULL,
	"expires_at" timestamp,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;