import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
    date,
} from "drizzle-orm/pg-core";
import {
    patients,
    doctors,
    appointments,
    prescriptionRouteEnum,
    examRequestTypeEnum,
    referralUrgencyEnum,
    patientAlertTypeEnum,
    procedures,
    icd10Codes,
    healthInsurances,
} from "./medical";
import { clinics, hospitals } from "./clinics";
import { users } from "./auth";
import { serviceTypes, checkIns } from "./check-ins";
import { medications } from "./medications";

// 1. Consultations (encounters)
export const consultations = pgTable("consultations", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    serviceTypeId: uuid("service_type_id").references(() => serviceTypes.id, { onDelete: "set null" }),
    healthInsuranceId: uuid("health_insurance_id").references(() => healthInsurances.id, { onDelete: "set null" }),
    checkInId: uuid("check_in_id").references(() => checkIns.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"), // waiting, in_progress, finished, cancelled
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surgeryStatusEnum = pgEnum("surgery_status", [
    "scheduled",
    "waiting",
    "in_progress",
    "finished",
    "cancelled",
]);

export const surgeries = pgTable("surgeries", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    checkInId: uuid("check_in_id").references(() => checkIns.id, { onDelete: "set null" }),
    serviceTypeId: uuid("service_type_id").references(() => serviceTypes.id, { onDelete: "set null" }),
    healthInsuranceId: uuid("health_insurance_id").references(() => healthInsurances.id, {
        onDelete: "set null",
    }),
    hospitalId: uuid("hospital_id").references(() => hospitals.id, { onDelete: "set null" }),
    surgeonId: uuid("surgeon_id").references(() => doctors.id, { onDelete: "set null" }),
    firstAuxId: uuid("first_aux_id").references(() => doctors.id, { onDelete: "set null" }),
    secondAuxId: uuid("second_aux_id").references(() => doctors.id, { onDelete: "set null" }),
    thirdAuxId: uuid("third_aux_id").references(() => doctors.id, { onDelete: "set null" }),
    anesthetistId: uuid("anesthetist_id").references(() => doctors.id, { onDelete: "set null" }),
    instrumentistId: uuid("instrumentist_id").references(() => doctors.id, { onDelete: "set null" }),
    surgeryDate: date("surgery_date"),
    status: surgeryStatusEnum("status").notNull().default("scheduled"),
    repasseHospital: boolean("repasse_hospital").default(false).notNull(),
    repasseAnesthesia: boolean("repasse_anesthesia").default(false).notNull(),
    repassePathology: boolean("repasse_pathology").default(false).notNull(),
    repasseDoctor: boolean("repasse_doctor").default(false).notNull(),
    repasseInstrumentist: boolean("repasse_instrumentist").default(false).notNull(),
    repasseMedicalAux: boolean("repasse_medical_aux").default(false).notNull(),
    usesMonitor: boolean("uses_monitor").default(false).notNull(),
    cancerDiagnosis: boolean("cancer_diagnosis").default(false).notNull(),
    observations: text("observations"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const surgeryProcedures = pgTable("surgery_procedures", {
    id: uuid("id").primaryKey().defaultRandom(),
    surgeryId: uuid("surgery_id")
        .notNull()
        .references(() => surgeries.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id")
        .notNull()
        .references(() => procedures.id, { onDelete: "restrict" }),
});

// 3. SOAP documentation per consultation
export const consultationSoap = pgTable("consultation_soap", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .unique()
        .references(() => consultations.id, { onDelete: "cascade" }),

    subjective: text("subjective"),
    objective: text("objective"),
    assessment: text("assessment"),
    diagnosisCidId: uuid("diagnosis_cid_id").references(() => icd10Codes.id),
    diagnosisFreeText: text("diagnosis_free_text"),

    plan: text("plan"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Vital signs per consultation
export const vitalSigns = pgTable("vital_signs", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .references(() => consultations.id, { onDelete: "cascade" }),
    weight: varchar("weight", { length: 10 }),
    height: varchar("height", { length: 10 }),
    bloodPressure: varchar("blood_pressure", { length: 20 }),
    heartRate: integer("heart_rate"),
    respiratoryRate: integer("respiratory_rate"),
    temperature: varchar("temperature", { length: 10 }),
    oxygenSaturation: integer("oxygen_saturation"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Prescription line items
export const prescriptions = pgTable("prescriptions", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .references(() => consultations.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    medicationId: uuid("medication_id").references(() => medications.id, {
        onDelete: "set null",
    }),
    medicineName: varchar("medicine_name", { length: 255 }).notNull(),
    dosage: varchar("dosage", { length: 255 }),
    pharmaceuticalForm: varchar("pharmaceutical_form", { length: 100 }),
    frequency: varchar("frequency", { length: 255 }),
    duration: varchar("duration", { length: 100 }),
    quantity: varchar("quantity", { length: 100 }),
    route: prescriptionRouteEnum("route").default("oral"),
    instructions: text("instructions"),
    isContinuous: boolean("is_continuous").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Exam requests
export const examRequests = pgTable("exam_requests", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .references(() => consultations.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: examRequestTypeEnum("type").default("lab"),
    urgency: varchar("urgency", { length: 20 }).default("routine"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Referrals
export const referrals = pgTable("referrals", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .references(() => consultations.id, { onDelete: "cascade" }),
    specialtyName: varchar("specialty_name", { length: 255 }).notNull(),
    reason: text("reason"),
    urgency: referralUrgencyEnum("urgency").default("routine"),
    targetDoctorName: varchar("target_doctor_name", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Patient alerts (allergies, etc.)
export const patientAlerts = pgTable("patient_alerts", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    type: patientAlertTypeEnum("type").notNull(),
    description: text("description").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fileCategoryEnum = pgEnum("file_category", [
    "lab_exam",
    "imaging",
    "clinical_photo",
    "report",
    "other",
]);

export const patientFiles = pgTable("patient_files", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    consultationId: uuid("consultation_id").references(() => consultations.id, { onDelete: "set null" }),
    surgeryId: uuid("surgery_id").references(() => surgeries.id, { onDelete: "set null" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by")
        .notNull()
        .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    category: fileCategoryEnum("category").notNull(),
    remoteKey: text("remote_key").notNull().unique(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes"),
    referenceDate: date("reference_date"),
    notes: text("notes"),
    /** Shared UUID for all files uploaded in the same multi-upload session. */
    uploadGroupId: uuid("upload_group_id"),
    /** Position within the group (0-based); used to order the carousel. */
    groupOrder: integer("group_order"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { relations } from "drizzle-orm";

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
    patient: one(patients, {
        fields: [consultations.patientId],
        references: [patients.id],
    }),
    doctor: one(doctors, {
        fields: [consultations.doctorId],
        references: [doctors.id],
    }),
    appointment: one(appointments, {
        fields: [consultations.appointmentId],
        references: [appointments.id],
    }),
    serviceType: one(serviceTypes, {
        fields: [consultations.serviceTypeId],
        references: [serviceTypes.id],
    }),
    checkIn: one(checkIns, {
        fields: [consultations.checkInId],
        references: [checkIns.id],
    }),
    healthInsurance: one(healthInsurances, {
        fields: [consultations.healthInsuranceId],
        references: [healthInsurances.id],
    }),
    soap: one(consultationSoap, {
        fields: [consultations.id],
        references: [consultationSoap.consultationId],
    }),
    vitalSigns: many(vitalSigns),
    prescriptions: many(prescriptions),
    examRequests: many(examRequests),
    referrals: many(referrals),
    patientFiles: many(patientFiles),
}));

export const consultationSoapRelations = relations(consultationSoap, ({ one }) => ({
    consultation: one(consultations, {
        fields: [consultationSoap.consultationId],
        references: [consultations.id],
    }),
    diagnosisCid: one(icd10Codes, {
        fields: [consultationSoap.diagnosisCidId],
        references: [icd10Codes.id],
    }),
}));

export const vitalSignsRelations = relations(vitalSigns, ({ one }) => ({
    consultation: one(consultations, {
        fields: [vitalSigns.consultationId],
        references: [consultations.id],
    }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
    consultation: one(consultations, {
        fields: [prescriptions.consultationId],
        references: [consultations.id],
    }),
    medication: one(medications, {
        fields: [prescriptions.medicationId],
        references: [medications.id],
    }),
}));

export const examRequestsRelations = relations(examRequests, ({ one }) => ({
    consultation: one(consultations, {
        fields: [examRequests.consultationId],
        references: [consultations.id],
    }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
    consultation: one(consultations, {
        fields: [referrals.consultationId],
        references: [consultations.id],
    }),
}));

export const patientAlertsRelations = relations(patientAlerts, ({ one }) => ({
    patient: one(patients, {
        fields: [patientAlerts.patientId],
        references: [patients.id],
    }),
}));

export const patientFilesRelations = relations(patientFiles, ({ one }) => ({
    patient: one(patients, {
        fields: [patientFiles.patientId],
        references: [patients.id],
    }),
    consultation: one(consultations, {
        fields: [patientFiles.consultationId],
        references: [consultations.id],
    }),
    surgery: one(surgeries, {
        fields: [patientFiles.surgeryId],
        references: [surgeries.id],
    }),
    clinic: one(clinics, {
        fields: [patientFiles.clinicId],
        references: [clinics.id],
    }),
    uploader: one(users, {
        fields: [patientFiles.uploadedBy],
        references: [users.id],
    }),
}));

export const surgeriesRelations = relations(surgeries, ({ one, many }) => ({
    patient: one(patients, {
        fields: [surgeries.patientId],
        references: [patients.id],
    }),
    clinic: one(clinics, {
        fields: [surgeries.clinicId],
        references: [clinics.id],
    }),
    checkIn: one(checkIns, {
        fields: [surgeries.checkInId],
        references: [checkIns.id],
    }),
    serviceType: one(serviceTypes, {
        fields: [surgeries.serviceTypeId],
        references: [serviceTypes.id],
    }),
    healthInsurance: one(healthInsurances, {
        fields: [surgeries.healthInsuranceId],
        references: [healthInsurances.id],
    }),
    hospital: one(hospitals, {
        fields: [surgeries.hospitalId],
        references: [hospitals.id],
    }),
    surgeon: one(doctors, {
        fields: [surgeries.surgeonId],
        references: [doctors.id],
    }),
    firstAux: one(doctors, {
        fields: [surgeries.firstAuxId],
        references: [doctors.id],
    }),
    secondAux: one(doctors, {
        fields: [surgeries.secondAuxId],
        references: [doctors.id],
    }),
    thirdAux: one(doctors, {
        fields: [surgeries.thirdAuxId],
        references: [doctors.id],
    }),
    anesthetist: one(doctors, {
        fields: [surgeries.anesthetistId],
        references: [doctors.id],
    }),
    instrumentist: one(doctors, {
        fields: [surgeries.instrumentistId],
        references: [doctors.id],
    }),
    procedureLinks: many(surgeryProcedures),
    patientFiles: many(patientFiles),
}));

export const surgeryProceduresRelations = relations(surgeryProcedures, ({ one }) => ({
    surgery: one(surgeries, {
        fields: [surgeryProcedures.surgeryId],
        references: [surgeries.id],
    }),
    procedure: one(procedures, {
        fields: [surgeryProcedures.procedureId],
        references: [procedures.id],
    }),
}));
