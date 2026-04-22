import { z } from "zod";

export const checkInSchema = z.object({
    patientId: z.string().uuid("Paciente inválido"),
    serviceTypeId: z.string().uuid("Tipo de atendimento inválido"),
    doctorId: z.string().uuid("Médico inválido"),
    healthInsuranceId: z.string().uuid("Convênio inválido").optional().nullable().or(z.literal("")),
    notes: z.string().trim().max(1000, "Observação muito longa").optional().or(z.literal("")),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
