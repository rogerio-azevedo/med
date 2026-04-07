CREATE TABLE "clinic_user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_user_id" uuid NOT NULL,
	"feature_slug" varchar(100) NOT NULL,
	"actions" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_clinic_user_feature" UNIQUE("clinic_user_id","feature_slug")
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "features_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "clinic_user_permissions" ADD CONSTRAINT "clinic_user_permissions_clinic_user_id_clinic_users_id_fk" FOREIGN KEY ("clinic_user_id") REFERENCES "public"."clinic_users"("id") ON DELETE cascade ON UPDATE no action;