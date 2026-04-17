ALTER TABLE "procedures" ADD COLUMN IF NOT EXISTS "cid_id" uuid;

ALTER TABLE "procedures" DROP CONSTRAINT IF EXISTS "procedures_cid_id_icd10_codes_id_fk";

ALTER TABLE "procedures"
  ADD CONSTRAINT "procedures_cid_id_icd10_codes_id_fk"
  FOREIGN KEY ("cid_id") REFERENCES "public"."icd10_codes"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
