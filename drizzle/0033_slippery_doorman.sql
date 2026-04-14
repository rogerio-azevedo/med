CREATE TABLE "score_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"score" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "score_items" ADD CONSTRAINT "score_items_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "score_items_clinic_name_unique" ON "score_items" USING btree ("clinic_id","name");
--> statement-breakpoint
INSERT INTO "score_items" ("clinic_id", "name", "description", "score")
SELECT
	"clinics"."id",
	"defaults"."name",
	NULL,
	"defaults"."score"
FROM "clinics"
CROSS JOIN (
	VALUES
		('Consulta convênio', 1),
		('US tireoide', 2),
		('Consulta particular', 3),
		('US + PAAF', 5),
		('Programa nódulo seguro', 8),
		('Cirurgia convênio', 8),
		('Programa 12M', 13),
		('Programa Hashimoto', 21),
		('Cirurgia particular', 55)
) AS "defaults"("name", "score")
ON CONFLICT ("clinic_id", "name") DO NOTHING;
