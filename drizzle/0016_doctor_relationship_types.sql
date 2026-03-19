CREATE TYPE "public"."doctor_clinic_relationship_type" AS ENUM('linked', 'partner');
--> statement-breakpoint
ALTER TABLE "clinic_doctors"
ADD COLUMN "relationship_type" "doctor_clinic_relationship_type" DEFAULT 'linked' NOT NULL;
--> statement-breakpoint
ALTER TABLE "invite_links"
ADD COLUMN "doctor_relationship_type" "doctor_clinic_relationship_type";
