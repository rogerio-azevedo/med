-- Tabelas legadas substituídas por `consultations` + `consultation_soap` (prontuário).
-- Idempotente: seguro se já tiver sido aplicado em 0038_encounter_checkin.sql.
DROP TABLE IF EXISTS "medical_records";--> statement-breakpoint
DROP TABLE IF EXISTS "service_records";--> statement-breakpoint
DROP TYPE IF EXISTS "service_record_type";
