ALTER TABLE "clinics" ADD COLUMN "proposal_general_notes" text;
ALTER TABLE "clinics" ADD COLUMN "proposal_payment_info" text;

UPDATE "clinics"
SET "proposal_general_notes" = "proposal_conditions"
WHERE "proposal_conditions" IS NOT NULL AND trim("proposal_conditions") <> '';

ALTER TABLE "clinics" DROP COLUMN "proposal_conditions";
