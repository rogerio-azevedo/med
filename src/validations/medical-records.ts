import { z } from "zod";

export const consultationSchema = z.object({
    patientId: z.string().uuid(),
    doctorId: z.string().uuid(),
    clinicId: z.string().uuid(),
    appointmentId: z.string().uuid().optional().nullable(),
    serviceTypeId: z.string().uuid().optional().nullable(),
    healthInsuranceId: z.string().uuid().optional().nullable(),
    checkInId: z.string().uuid().optional().nullable(),
    parentConsultationId: z.string().uuid().optional().nullable(),
    status: z.string().optional().default("in_progress"),
});

export const consultationSoapSchema = z.object({
    consultationId: z.string().uuid(),
    subjective: z.string().optional().nullable(),
    objective: z.string().optional().nullable(),
    assessment: z.string().optional().nullable(),
    diagnosisCidId: z.string().uuid().optional().nullable(),
    diagnosisFreeText: z.string().optional().nullable(),
    plan: z.string().optional().nullable(),
});

export const vitalSignsSchema = z.object({
    consultationId: z.string().uuid(),
    weight: z.string().max(10).optional().nullable(),
    height: z.string().max(10).optional().nullable(),
    bloodPressure: z.string().max(20).optional().nullable(),
    heartRate: z.number().int().optional().nullable(),
    respiratoryRate: z.number().int().optional().nullable(),
    temperature: z.string().max(10).optional().nullable(),
    oxygenSaturation: z.number().int().max(100).optional().nullable(),
});

const prescriptionRouteValues = [
    "oral",
    "iv",
    "im",
    "sc",
    "topical",
    "inhaled",
    "ophthalmic",
    "otic",
    "rectal",
    "vaginal",
    "other",
] as const;

export const prescriptionSchema = z.object({
    consultationId: z.string().uuid(),
    patientId: z.string().uuid(),
    clinicId: z.string().uuid(),
    medicationId: z.string().uuid().optional().nullable(),
    medicineName: z.string().min(1).max(255),
    dosage: z.string().max(255).optional().nullable(),
    pharmaceuticalForm: z.string().max(100).optional().nullable(),
    frequency: z.string().max(255).optional().nullable(),
    duration: z.string().max(100).optional().nullable(),
    quantity: z.string().max(100).optional().nullable(),
    route: z.enum(prescriptionRouteValues).optional().default("oral"),
    instructions: z.string().optional().nullable(),
    isContinuous: z.boolean().default(false),
    startDate: z.string().max(10).optional().nullable(),
    endDate: z.string().max(10).optional().nullable(),
});

/** Payload for adding a prescription line (IDs come from the server action). */
export const prescriptionItemPayloadSchema = z.object({
    medicationId: z.string().uuid().optional().nullable(),
    medicineName: z.string().min(1).max(255),
    dosage: z.string().max(255).optional().nullable(),
    pharmaceuticalForm: z.string().max(100).optional().nullable(),
    frequency: z.string().max(255).optional().nullable(),
    duration: z.string().max(100).optional().nullable(),
    quantity: z.string().max(100).optional().nullable(),
    route: z.enum(prescriptionRouteValues).default("oral"),
    instructions: z.string().optional().nullable(),
    isContinuous: z.boolean().default(false),
    startDate: z.string().max(10).optional().nullable(),
    endDate: z.string().max(10).optional().nullable(),
});

export const examRequestSchema = z.object({
    consultationId: z.string().uuid(),
    patientId: z.string().uuid(),
    clinicId: z.string().uuid(),
    name: z.string().min(1).max(255),
    type: z.enum(["lab", "imaging", "ecg", "biopsy", "other"]).optional().default("lab"),
    urgency: z.string().optional().default("routine"),
    notes: z.string().optional().nullable(),
});

export const referralSchema = z.object({
    consultationId: z.string().uuid(),
    specialtyName: z.string().min(1).max(255),
    reason: z.string().optional().nullable(),
    urgency: z.enum(["routine", "priority", "urgent"]).optional().default("routine"),
    targetDoctorName: z.string().max(255).optional().nullable(),
});

export const patientAlertSchema = z.object({
    patientId: z.string().uuid(),
    clinicId: z.string().uuid(),
    type: z.enum(["allergy", "comorbidity", "chronic_medication", "important_note"]),
    description: z.string().min(1),
    isActive: z.boolean().default(true),
});
