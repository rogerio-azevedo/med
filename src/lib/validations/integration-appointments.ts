import { z } from "zod";
import { appointmentModalityValues } from "./appointments";

const cpfClean = (value: string) => value.replace(/\D/g, "");
const crmClean = (value: string) => value.replace(/\D/g, "");
const isoDateTimeWithTimezoneRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const isoDateTimeWithTimezoneSchema = z
    .string()
    .refine(
        (value) =>
            isoDateTimeWithTimezoneRegex.test(value) &&
            !Number.isNaN(new Date(value).getTime()),
        "Data/hora inválida. Use ISO 8601 com timezone, por exemplo 2026-03-19T16:30:00-04:00 ou 2026-03-19T20:30:00Z"
    );

const doctorIdentifierSchema = z
    .object({
        doctorId: z.string().uuid("Médico inválido").optional(),
        doctorCrm: z
            .string()
            .optional()
            .transform((value) => (value ? crmClean(value) : undefined))
            .refine((value) => !value || value.length > 0, "CRM inválido"),
        doctorCrmState: z
            .string()
            .optional()
            .transform((value) => (value ? value.trim().toUpperCase() : undefined))
            .refine((value) => !value || value.length === 2, "UF do CRM deve ter 2 caracteres"),
    })
    .superRefine((data, ctx) => {
        const hasDoctorId = !!data.doctorId;
        const hasCrmPair = !!data.doctorCrm || !!data.doctorCrmState;

        if (!hasDoctorId && !hasCrmPair) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe `doctorId` ou `doctorCrm` + `doctorCrmState`.",
                path: ["doctorId"],
            });
        }

        if (hasDoctorId && hasCrmPair) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe apenas um identificador de médico por vez.",
                path: ["doctorId"],
            });
        }

        if (!!data.doctorCrm !== !!data.doctorCrmState) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe `doctorCrm` e `doctorCrmState` juntos.",
                path: ["doctorCrm"],
            });
        }
    });

const patientIdentifierSchema = z
    .object({
        patientId: z.string().uuid("Paciente inválido").optional(),
        patientCpf: z
            .string()
            .optional()
            .transform((value) => (value ? cpfClean(value) : undefined))
            .refine((value) => !value || value.length === 11, "CPF deve ter 11 dígitos"),
    })
    .superRefine((data, ctx) => {
        if (!data.patientId && !data.patientCpf) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe `patientId` ou `patientCpf`.",
                path: ["patientId"],
            });
        }

        if (data.patientId && data.patientCpf) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe apenas um identificador de paciente por vez.",
                path: ["patientId"],
            });
        }
    });

export const createIntegrationAppointmentSchema = z
    .object({
        specialtyId: z.string().uuid("Especialidade inválida").optional(),
        scheduledAt: isoDateTimeWithTimezoneSchema,
        durationMinutes: z
            .number()
            .int()
            .min(10, "Duração mínima de 10 minutos")
            .max(480, "Duração máxima de 8 horas"),
        modality: z.enum(appointmentModalityValues, {
            message: "Modalidade inválida",
        }),
        notes: z.string().max(1000).optional(),
        externalRequestId: z.string().max(120).optional(),
    })
    .and(doctorIdentifierSchema)
    .and(patientIdentifierSchema);

export const patchIntegrationAppointmentSchema = z
    .object({
        doctorId: z.string().uuid("Médico inválido").optional(),
        doctorCrm: z
            .string()
            .optional()
            .transform((value) => (value ? crmClean(value) : undefined))
            .refine((value) => !value || value.length > 0, "CRM inválido"),
        doctorCrmState: z
            .string()
            .optional()
            .transform((value) => (value ? value.trim().toUpperCase() : undefined))
            .refine((value) => !value || value.length === 2, "UF do CRM deve ter 2 caracteres"),
        specialtyId: z.string().uuid("Especialidade inválida").nullable().optional(),
        scheduledAt: isoDateTimeWithTimezoneSchema.optional(),
        durationMinutes: z
            .number()
            .int()
            .min(10, "Duração mínima de 10 minutos")
            .max(480, "Duração máxima de 8 horas")
            .optional(),
        modality: z
            .enum(appointmentModalityValues, {
                message: "Modalidade inválida",
            })
            .optional(),
        notes: z.string().max(1000).nullable().optional(),
        patientId: z.string().uuid("Paciente inválido").optional(),
        patientCpf: z
            .string()
            .optional()
            .transform((value) => (value ? cpfClean(value) : undefined))
            .refine((value) => !value || value.length === 11, "CPF deve ter 11 dígitos"),
        externalRequestId: z.string().max(120).optional(),
    })
    .superRefine((data, ctx) => {
        const hasAnyField = [
            data.doctorId,
            data.doctorCrm,
            data.doctorCrmState,
            data.specialtyId,
            data.scheduledAt,
            data.durationMinutes,
            data.modality,
            data.notes,
            data.patientId,
            data.patientCpf,
        ].some((value) => value !== undefined);

        if (!hasAnyField) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe ao menos um campo para atualização.",
                path: ["scheduledAt"],
            });
        }

        if (data.patientId && data.patientCpf) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe apenas um identificador de paciente por vez.",
                path: ["patientId"],
            });
        }

        const hasDoctorId = !!data.doctorId;
        const hasCrmPair = !!data.doctorCrm || !!data.doctorCrmState;

        if (hasDoctorId && hasCrmPair) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe apenas um identificador de médico por vez.",
                path: ["doctorId"],
            });
        }

        if (!!data.doctorCrm !== !!data.doctorCrmState) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe `doctorCrm` e `doctorCrmState` juntos.",
                path: ["doctorCrm"],
            });
        }
    });

export const createAppointmentIntegrationCredentialSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Nome deve ter pelo menos 3 caracteres")
        .max(120, "Nome deve ter no máximo 120 caracteres"),
});

export type CreateIntegrationAppointmentInput = z.infer<
    typeof createIntegrationAppointmentSchema
>;
export type PatchIntegrationAppointmentInput = z.infer<
    typeof patchIntegrationAppointmentSchema
>;
export type UpdateIntegrationAppointmentInput = {
    doctorId: string;
    patientId: string;
    specialtyId?: string;
    scheduledAt: string;
    durationMinutes: number;
    modality: (typeof appointmentModalityValues)[number];
    notes?: string;
};
export type CreateAppointmentIntegrationCredentialInput = z.infer<
    typeof createAppointmentIntegrationCredentialSchema
>;
