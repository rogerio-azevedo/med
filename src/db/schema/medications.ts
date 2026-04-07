import {
  pgEnum,
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const medicationStatusEnum = pgEnum("medication_status", ["active", "inactive"]);

export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  activeIngredient: text("active_ingredient").notNull(),
  brandName: varchar("brand_name", { length: 255 }),
  genericName: text("generic_name"),
  concentration: varchar("concentration", { length: 255 }),
  pharmaceuticalForm: varchar("pharmaceutical_form", { length: 100 }).notNull(),
  presentation: text("presentation"),
  route: varchar("route", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  anvisaRegistry: varchar("anvisa_registry", { length: 50 }),
  therapeuticClass: varchar("therapeutic_class", { length: 255 }),
  controlledSubstance: boolean("controlled_substance").default(false).notNull(),
  requiresPrescription: boolean("requires_prescription").default(true).notNull(),
  status: medicationStatusEnum("status").default("active").notNull(),
  searchText: text("search_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
