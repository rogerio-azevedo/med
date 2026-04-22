import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    date,
    jsonb,
    pgEnum,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { clinics } from "./clinics";
import { healthInsurances } from "./health-insurances";
import { doctors } from "./doctors";

export const sexEnum = pgEnum("sex", ["M", "F", "other"]);

export const patientOriginTypeEnum = pgEnum("patient_origin_type", [
    "instagram",
    "google",
    "facebook",
    "friends_family",
    "medical_referral",
]);
export const patientReferralSourceEnum = pgEnum("patient_referral_source", [
    "patient_reported",
    "doctor_reported",
    "invite_link",
    "manual",
]);
export const patientReferralStatusEnum = pgEnum("patient_referral_status", [
    "active",
    "cancelled",
]);

export const patients = pgTable("patients", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    cpf: varchar("cpf", { length: 14 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    birthDate: date("birth_date"),
    sex: sexEnum("sex"),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    healthInsurance: jsonb("health_insurance"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientHealthInsurances = pgTable("patient_health_insurances", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    healthInsuranceId: uuid("health_insurance_id")
        .notNull()
        .references(() => healthInsurances.id, { onDelete: "cascade" }),
    cardNumber: varchar("card_number", { length: 100 }),
    planName: varchar("plan_name", { length: 150 }),
    planCode: varchar("plan_code", { length: 50 }),
    holderName: varchar("holder_name", { length: 255 }),
    holderCpf: varchar("holder_cpf", { length: 14 }),
    validUntil: date("valid_until"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clinicPatients = pgTable("clinic_patients", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").default(true).notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const patientDoctors = pgTable("patient_doctors", {
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
});

export const patientOrigins = pgTable("patient_origins", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    originType: patientOriginTypeEnum("origin_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    patientClinicUniqueIdx: uniqueIndex("patient_origins_patient_clinic_unique").on(
        table.patientId,
        table.clinicId
    ),
}));

export const patientReferrals = pgTable("patient_referrals", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "restrict" }),
    source: patientReferralSourceEnum("source").notNull(),
    status: patientReferralStatusEnum("status").default("active").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmed_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelledByUserId: text("cancelled_by_user_id").references(() => users.id, {
        onDelete: "set null",
    }),
}, (table) => ({
    clinicDoctorIdx: index("patient_referrals_clinic_doctor_idx").on(
        table.clinicId,
        table.doctorId
    ),
    clinicPatientIdx: index("patient_referrals_clinic_patient_idx").on(
        table.clinicId,
        table.patientId
    ),
    statusIdx: index("patient_referrals_status_idx").on(table.status),
}));

export const patientsRelations = relations(patients, ({ one }) => ({
    user: one(users, {
        fields: [patients.userId],
        references: [users.id],
    }),
}));
