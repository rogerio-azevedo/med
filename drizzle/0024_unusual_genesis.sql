CREATE TYPE "public"."medication_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"active_ingredient" text NOT NULL,
	"brand_name" varchar(255),
	"generic_name" text,
	"concentration" varchar(255),
	"pharmaceutical_form" varchar(100) NOT NULL,
	"presentation" text,
	"route" varchar(100),
	"manufacturer" varchar(255),
	"anvisa_registry" varchar(50),
	"therapeutic_class" varchar(255),
	"controlled_substance" boolean DEFAULT false NOT NULL,
	"requires_prescription" boolean DEFAULT true NOT NULL,
	"status" "medication_status" DEFAULT 'active' NOT NULL,
	"search_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
