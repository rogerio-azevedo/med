ALTER TABLE "procedures" ADD COLUMN IF NOT EXISTS "clinic_id" uuid;

ALTER TABLE "procedures" DROP CONSTRAINT IF EXISTS "procedures_clinic_id_clinics_id_fk";

ALTER TABLE "procedures"
  ADD CONSTRAINT "procedures_clinic_id_clinics_id_fk"
  FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Backfill clinic from surgeries (one deterministic clinic per procedure if several exist)
UPDATE "procedures" AS p
SET "clinic_id" = sub."clinic_id"
FROM (
    SELECT DISTINCT ON (sp."procedure_id")
        sp."procedure_id",
        s."clinic_id"
    FROM "surgery_procedures" AS sp
    INNER JOIN "surgeries" AS s ON s."id" = sp."surgery_id"
    ORDER BY sp."procedure_id", s."clinic_id"
) AS sub
WHERE sub."procedure_id" = p."id"
  AND p."clinic_id" IS NULL;
