import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";
import { clinics } from "./clinics";

export const procedureTypeEnum = pgEnum("procedure_type", [
    "general",
    "consultation",
    "exam",
    "therapy",
    "hospitalization",
]);

export const specialties = pgTable("specialties", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }),
});

export const practiceAreas = pgTable("practice_areas", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }),
});

export const icd10Codes = pgTable("icd10_codes", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 10 }).notNull().unique(),
    description: varchar("description", { length: 500 }).notNull(),
    category: varchar("category", { length: 10 }),
    categoryDesc: varchar("description_category", { length: 500 }),
    chapter: varchar("chapter", { length: 10 }),
    chapterDesc: varchar("description_chapter", { length: 500 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const procedures = pgTable("procedures", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
    type: procedureTypeEnum("type").notNull(),
    tussCode: varchar("tuss_code", { length: 50 }),
    name: text("name").notNull(),
    description: text("description"),
    purpose: varchar("purpose", { length: 255 }),
    cidId: uuid("cid_id").references(() => icd10Codes.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
