import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    date,
    integer,
    time,
    pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { clinics } from "./clinics";

// Enums
export const sexEnum = pgEnum("sex", ["M", "F", "other"]);
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
export const serviceRecordTypeEnum = pgEnum("service_record_type", [
    "consultation",
    "remote",
    "phone",
    "whatsapp",
    "exam_review",
    "other",
]);
export const packageStatusEnum = pgEnum("package_status", [
    "active",
    "completed",
    "cancelled",
]);

// 4. Specialties
export const specialties = pgTable("specialties", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }),
});

// 5. Practice Areas
export const practiceAreas = pgTable("practice_areas", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }),
});

// 6. Doctors (Global Profile)
export const doctors = pgTable("doctors", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    crm: varchar("crm", { length: 20 }),
    crmState: varchar("crm_state", { length: 2 }),
    phone: varchar("phone", { length: 20 }),
    bio: text("bio"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Clinic Doctors (Doctor <-> Clinic)
export const clinicDoctors = pgTable("clinic_doctors", {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// 8. Doctor Specialties (N:N)
export const doctorSpecialties = pgTable("doctor_specialties", {
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    specialtyId: uuid("specialty_id")
        .notNull()
        .references(() => specialties.id, { onDelete: "cascade" }),
});

// 9. Doctor Practice Areas (N:N)
export const doctorPracticeAreas = pgTable("doctor_practice_areas", {
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    practiceAreaId: uuid("practice_area_id")
        .notNull()
        .references(() => practiceAreas.id, { onDelete: "cascade" }),
});

// 10. Patients (Global)
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

// 11. Clinic Patients (Patient <-> Clinic)
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

// 11.a Patient Doctors (N:N)
export const patientDoctors = pgTable("patient_doctors", {
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
});

// 12. Doctor Schedules
export const doctorSchedules = pgTable("doctor_schedules", {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 0=Dom ... 6=Sab
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    slotDurationMin: integer("slot_duration_min").default(30),
    isActive: boolean("is_active").default(true).notNull(),
});

// 16. Care Packages
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

// 17. Patient Packages
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

// 13. Appointments
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

// 14. Service Records (Timeline)
export const serviceRecords = pgTable("service_records", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    type: serviceRecordTypeEnum("type").notNull(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    durationMinutes: integer("duration_minutes"),
    summary: text("summary"),
    attachments: jsonb("attachments"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Medical Records (Prontuário)
export const medicalRecords = pgTable("medical_records", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    serviceRecordId: uuid("service_record_id")
        .notNull()
        .references(() => serviceRecords.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    anamnesis: text("anamnesis"),
    diagnosis: text("diagnosis"),
    cid10: varchar("cid10", { length: 10 }),
    prescriptions: jsonb("prescriptions"),
    observations: text("observations"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
