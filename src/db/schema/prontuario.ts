import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    integer,
    date,
} from "drizzle-orm/pg-core";
import { patients, doctors, appointments, consultationTypeEnum, prescriptionRouteEnum, examRequestTypeEnum, referralUrgencyEnum, patientAlertTypeEnum } from "./medical";
import { clinics } from "./clinics";
import { users } from "./auth";

// 1. ICD-10 Codes (Tabela de Referência Oficial)
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

// 2. Consultations (Atendimentos Independentes)
export const consultations = pgTable("consultations", {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .notNull()
        .references(() => doctors.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    type: consultationTypeEnum("type").notNull().default("consultation"),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress, finalized, cancelled
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Consultation SOAP (Estrutura do Prontuário)
export const consultationSoap = pgTable("consultation_soap", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .unique()
        .references(() => consultations.id, { onDelete: "cascade" }),
    
    // S - Subjetivo
    subjective: text("subjective"), // Queixa, HDA
    
    // O - Objetivo
    objective: text("objective"), // Exame físico resumido
    
    // A - Avaliação
    assessment: text("assessment"), // Hipóteses, raciocínio clínico
    diagnosisCidId: uuid("diagnosis_cid_id").references(() => icd10Codes.id),
    diagnosisFreeText: text("diagnosis_free_text"),
    
    // P - Plano
    plan: text("plan"), // Conduta geral e observações
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Vital Signs (Sinais Vitais por Consulta)
export const vitalSigns = pgTable("vital_signs", {
    id: uuid("id").primaryKey().defaultRandom(),
    consultationId: uuid("consultation_id")
        .notNull()
        .references(() => consultations.id, { onDelete: "cascade" }),
    weight: varchar("weight", { length: 10 }), // kg
    height: varchar("height", { length: 10 }), // cm
    bloodPressure: varchar("blood_pressure", { length: 20 }), // ex: 120/80
    heartRate: integer("heart_rate"), // bpm
    respiratoryRate: integer("respiratory_rate"), // rpm
    temperature: varchar("temperature", { length: 10 }), // °C
    oxygenSaturation: integer("oxygen_saturation"), // %
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Prescriptions (Prescrições Estruturadas)
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
    medicineName: varchar("medicine_name", { length: 255 }).notNull(),
    dosage: varchar("dosage", { length: 255 }), // ex: 500mg
    frequency: varchar("frequency", { length: 255 }), // ex: de 8 em 8 horas
    duration: varchar("duration", { length: 100 }), // ex: 7 dias
    route: prescriptionRouteEnum("route").default("oral"),
    instructions: text("instructions"), // orientações adicionais
    isContinuous: boolean("is_continuous").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Exam Requests (Solicitações de Exames)
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

// 7. Referrals (Encaminhamentos)
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

// 8. Patient Alerts (Alergias e Alertas Críticos)
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relacionamentos
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
    clinic: one(clinics, {
        fields: [patientFiles.clinicId],
        references: [clinics.id],
    }),
    uploader: one(users, {
        fields: [patientFiles.uploadedBy],
        references: [users.id],
    }),
}));
