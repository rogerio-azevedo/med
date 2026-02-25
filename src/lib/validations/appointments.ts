import { z } from "zod";

export const appointmentModalityValues = [
    "in_person",
    "remote",
    "phone",
    "whatsapp",
] as const;

export const appointmentStatusValues = [
    "scheduled",
    "confirmed",
    "in_progress",
    "done",
    "cancelled",
    "no_show",
] as const;

export const createAppointmentSchema = z.object({
    patientId: z.string().uuid("Paciente inválido"),
    doctorId: z.string().uuid("Médico inválido"),
    specialtyId: z.string().uuid("Especialidade inválida").optional(),
    patientPackageId: z.string().uuid("Pacote inválido").optional(),
    scheduledAt: z.string().datetime("Data/hora inválida"),
    durationMinutes: z
        .number()
        .int()
        .min(10, "Duração mínima de 10 minutos")
        .max(480, "Duração máxima de 8 horas"),
    modality: z.enum(appointmentModalityValues, {
        message: "Modalidade inválida",
    }),
    notes: z.string().max(1000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
    id: z.string().uuid("ID inválido"),
    status: z.enum(appointmentStatusValues, {
        message: "Status inválido",
    }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
