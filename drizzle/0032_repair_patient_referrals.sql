CREATE TABLE IF NOT EXISTS "patient_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"source" "patient_referral_source" NOT NULL,
	"status" "patient_referral_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by_user_id" text
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'patient_referrals_clinic_id_clinics_id_fk'
	) THEN
		ALTER TABLE "patient_referrals"
		ADD CONSTRAINT "patient_referrals_clinic_id_clinics_id_fk"
		FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'patient_referrals_patient_id_patients_id_fk'
	) THEN
		ALTER TABLE "patient_referrals"
		ADD CONSTRAINT "patient_referrals_patient_id_patients_id_fk"
		FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'patient_referrals_doctor_id_doctors_id_fk'
	) THEN
		ALTER TABLE "patient_referrals"
		ADD CONSTRAINT "patient_referrals_doctor_id_doctors_id_fk"
		FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id")
		ON DELETE restrict ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'patient_referrals_created_by_user_id_user_id_fk'
	) THEN
		ALTER TABLE "patient_referrals"
		ADD CONSTRAINT "patient_referrals_created_by_user_id_user_id_fk"
		FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id")
		ON DELETE set null ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'patient_referrals_cancelled_by_user_id_user_id_fk'
	) THEN
		ALTER TABLE "patient_referrals"
		ADD CONSTRAINT "patient_referrals_cancelled_by_user_id_user_id_fk"
		FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."user"("id")
		ON DELETE set null ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_referrals_clinic_doctor_idx" ON "patient_referrals" USING btree ("clinic_id","doctor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_referrals_clinic_patient_idx" ON "patient_referrals" USING btree ("clinic_id","patient_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_referrals_status_idx" ON "patient_referrals" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "patient_referrals_active_patient_unique" ON "patient_referrals" USING btree ("clinic_id","patient_id") WHERE "status" = 'active';
