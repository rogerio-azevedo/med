CREATE TYPE "public"."kanban_card_frequency" AS ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');--> statement-breakpoint
CREATE TYPE "public"."kanban_card_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."kanban_column_type" AS ENUM('TO_DO', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
CREATE TABLE "kanban_board_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_board_id" uuid NOT NULL,
	"target_board_id" uuid NOT NULL,
	"trigger_column_type" "kanban_column_type" DEFAULT 'DONE' NOT NULL,
	"copy_fields" jsonb DEFAULT '["title","description"]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_card_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_card_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kanban_card_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"kanban_column_id" uuid NOT NULL,
	"source_card_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"responsible_id" uuid,
	"priority" "kanban_card_priority" DEFAULT 'MEDIUM' NOT NULL,
	"position" integer NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"hour" varchar(5),
	"is_recurring_task" boolean DEFAULT false NOT NULL,
	"frequency" "kanban_card_frequency",
	"week_day" integer,
	"recurrence_dates" jsonb,
	"file_urls" jsonb,
	"category_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"column_type" "kanban_column_type" DEFAULT 'TO_DO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kanban_board_flows" ADD CONSTRAINT "kanban_board_flows_source_board_id_kanban_boards_id_fk" FOREIGN KEY ("source_board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_board_flows" ADD CONSTRAINT "kanban_board_flows_target_board_id_kanban_boards_id_fk" FOREIGN KEY ("target_board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_boards" ADD CONSTRAINT "kanban_boards_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_card_categories" ADD CONSTRAINT "kanban_card_categories_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_card_comments" ADD CONSTRAINT "kanban_card_comments_kanban_card_id_kanban_cards_id_fk" FOREIGN KEY ("kanban_card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_card_comments" ADD CONSTRAINT "kanban_card_comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_kanban_column_id_kanban_columns_id_fk" FOREIGN KEY ("kanban_column_id") REFERENCES "public"."kanban_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_responsible_id_clinic_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."clinic_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_category_id_kanban_card_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kanban_card_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;