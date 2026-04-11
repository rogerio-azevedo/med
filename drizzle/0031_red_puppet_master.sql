CREATE TYPE "public"."patient_referral_source" AS ENUM('patient_reported', 'doctor_reported', 'invite_link', 'manual');--> statement-breakpoint
CREATE TYPE "public"."patient_referral_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TABLE "patient_referrals" (
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
ALTER TABLE "patient_origins" DROP CONSTRAINT "patient_origins_referring_doctor_id_doctors_id_fk";
--> statement-breakpoint
WITH ranked_origins AS (
	SELECT
		id,
		clinic_id,
		patient_id,
		origin_type,
		referring_doctor_id,
		created_at,
		row_number() OVER (
			PARTITION BY clinic_id, patient_id
			ORDER BY created_at ASC, id ASC
		) AS row_num,
		count(*) OVER (
			PARTITION BY clinic_id, patient_id
		) AS duplicate_count
	FROM "patient_origins"
),
insertable_referrals AS (
	SELECT *
	FROM ranked_origins
	WHERE origin_type = 'medical_referral'
		AND referring_doctor_id IS NOT NULL
		AND row_num = 1
)
INSERT INTO "patient_referrals" (
	"clinic_id",
	"patient_id",
	"doctor_id",
	"source",
	"status",
	"notes",
	"created_at",
	"updated_at",
	"confirmed_at"
)
SELECT
	clinic_id,
	patient_id,
	referring_doctor_id,
	'manual',
	'active',
	CASE
		WHEN duplicate_count > 1 THEN 'Migrado automaticamente de patient_origins com registros duplicados.'
		ELSE 'Migrado automaticamente de patient_origins.'
	END,
	created_at,
	created_at,
	created_at
FROM insertable_referrals;
--> statement-breakpoint
DELETE FROM "patient_origins"
WHERE id IN (
	SELECT id
	FROM (
		SELECT
			id,
			row_number() OVER (
				PARTITION BY clinic_id, patient_id
				ORDER BY created_at ASC, id ASC
			) AS row_num
		FROM "patient_origins"
	) dedupe
	WHERE dedupe.row_num > 1
);
--> statement-breakpoint
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_referrals" ADD CONSTRAINT "patient_referrals_cancelled_by_user_id_user_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_referrals_clinic_doctor_idx" ON "patient_referrals" USING btree ("clinic_id","doctor_id");--> statement-breakpoint
CREATE INDEX "patient_referrals_clinic_patient_idx" ON "patient_referrals" USING btree ("clinic_id","patient_id");--> statement-breakpoint
CREATE INDEX "patient_referrals_status_idx" ON "patient_referrals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_referrals_active_patient_unique" ON "patient_referrals" USING btree ("clinic_id","patient_id") WHERE "status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "patient_origins_patient_clinic_unique" ON "patient_origins" USING btree ("patient_id","clinic_id");--> statement-breakpoint
ALTER TABLE "patient_origins" DROP COLUMN "referring_doctor_id";
