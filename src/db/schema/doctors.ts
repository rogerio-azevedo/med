import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { clinics } from "./clinics";
import { healthInsurances } from "./health-insurances";
import { specialties, practiceAreas } from "./specialties";

export const doctorClinicRelationshipTypeEnum = pgEnum("doctor_clinic_relationship_type", [
    "linked",
    "partner",
]);

export const doctors = pgTable("doctors", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    crm: varchar("crm", { length: 20 }),
    crmState: varchar("crm_state", { length: 2 }),
    phone: varchar("phone", { length: 20 }),
    bio: text("bio"),
    observations: text("observations"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorHealthInsurances = pgTable("doctor_health_insurances", {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    healthInsuranceId: uuid("health_insurance_id")
        .notNull()
        .references(() => healthInsurances.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clinicDoctors = pgTable("clinic_doctors", {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    relationshipType: doctorClinicRelationshipTypeEnum("relationship_type")
        .default("linked")
        .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const doctorSpecialties = pgTable("doctor_specialties", {
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    specialtyId: uuid("specialty_id")
        .notNull()
        .references(() => specialties.id, { onDelete: "cascade" }),
});

export const doctorPracticeAreas = pgTable("doctor_practice_areas", {
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    practiceAreaId: uuid("practice_area_id")
        .notNull()
        .references(() => practiceAreas.id, { onDelete: "cascade" }),
});

export const doctorsRelations = relations(doctors, ({ one }) => ({
    user: one(users, {
        fields: [doctors.userId],
        references: [users.id],
    }),
}));
