CREATE TABLE "payment_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "payment_term_id" uuid;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "payment_term_label" varchar(120);
--> statement-breakpoint
ALTER TABLE "payment_terms" ADD CONSTRAINT "payment_terms_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_payment_term_id_payment_terms_id_fk" FOREIGN KEY ("payment_term_id") REFERENCES "public"."payment_terms"("id") ON DELETE set null ON UPDATE no action;
