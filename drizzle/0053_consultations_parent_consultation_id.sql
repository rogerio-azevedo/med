ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "parent_consultation_id" uuid;

ALTER TABLE "consultations" DROP CONSTRAINT IF EXISTS "consultations_parent_consultation_id_consultations_id_fk";

ALTER TABLE "consultations"
  ADD CONSTRAINT "consultations_parent_consultation_id_consultations_id_fk"
  FOREIGN KEY ("parent_consultation_id") REFERENCES "public"."consultations"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "consultations_one_return_per_parent_idx"
  ON "consultations" ("parent_consultation_id")
  WHERE "parent_consultation_id" IS NOT NULL;
