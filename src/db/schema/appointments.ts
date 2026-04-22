import { pgTable, uuid, varchar, text, boolean, timestamp, date, integer, pgEnum } from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { doctors } from "./doctors";
import { patients } from "./patients";
import { specialties } from "./specialties";

export const appointmentModalityEnum = pgEnum("appointment_modality", [
    "in_person",
    "remote",
    "phone",
    "whatsapp",
]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
    "scheduled",
    "confirmed",
    "in_progress",
    "done",
    "cancelled",
    "no_show",
]);
export const packageStatusEnum = pgEnum("package_status", [
    "active",
    "completed",
    "cancelled",
]);

export const carePackages = pgTable("care_packages", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    durationDays: integer("duration_days"),
    consultationsIncluded: integer("consultations_included").default(0),
    remoteIncluded: integer("remote_included").default(0),
    supportIncluded: boolean("support_included").default(false),
    price: integer("price"), // Centavos
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientPackages = pgTable("patient_packages", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    packageId: uuid("package_id")
        .notNull()
        .references(() => carePackages.id),
    doctorId: uuid("doctor_id").references(() => doctors.id),
    startedAt: date("started_at").notNull(),
    expiresAt: date("expires_at"),
    status: packageStatusEnum("status").default("active"),
    consultationsUsed: integer("consultations_used").default(0),
    remoteUsed: integer("remote_used").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    specialtyId: uuid("specialty_id").references(() => specialties.id),
    /** Tipo de atendimento (catálogo da clínica). FK na migration para evitar import circular com service_types. */
    serviceTypeId: uuid("service_type_id"),
    patientPackageId: uuid("patient_package_id").references(
        () => patientPackages.id
    ),
    scheduledAt: timestamp("scheduled_at").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    modality: appointmentModalityEnum("modality").notNull(),
    status: appointmentStatusEnum("status").default("scheduled"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
