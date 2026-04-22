import { z } from "zod";

const cpfClean = (value: string) => value?.replace(/\D/g, "") ?? "";

export const healthInsuranceSchema = z.object({
    name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().trim().max(50, "Código muito longo").optional().or(z.literal("")),
    ansCode: z.string().trim().max(30, "Código ANS muito longo").optional().or(z.literal("")),
    notes: z.string().trim().max(500, "Observação muito longa").optional().or(z.literal("")),
});

export const healthInsuranceLinkSchema = z.object({
    healthInsuranceIds: z.array(z.string().uuid()).default([]),
});

export const patientHealthInsuranceSchema = z.object({
    id: z.string().uuid().optional(),
    healthInsuranceId: z.string().uuid("Convênio inválido"),
    cardNumber: z.string().trim().max(100, "Número da carteirinha muito longo").optional().or(z.literal("")),
    planName: z.string().trim().max(150, "Nome do plano muito longo").optional().or(z.literal("")),
    planCode: z.string().trim().max(50, "Código do plano muito longo").optional().or(z.literal("")),
    holderName: z.string().trim().max(255, "Nome do titular muito longo").optional().or(z.literal("")),
    holderCpf: z
        .string()
        .optional()
        .or(z.literal(""))
        .refine((value) => !value || cpfClean(value).length === 11, "CPF do titular deve ter 11 dígitos"),
    validUntil: z.string().optional().or(z.literal("")),
    isPrimary: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

export const patientHealthInsurancesSchema = z
    .array(patientHealthInsuranceSchema)
    .refine(
        (items) => items.filter((item) => item.isPrimary && item.isActive !== false).length <= 1,
        "Apenas um convênio pode ser definido como principal"
    );

export type HealthInsuranceInput = z.infer<typeof healthInsuranceSchema>;
export type HealthInsuranceLinkInput = z.infer<typeof healthInsuranceLinkSchema>;
export type PatientHealthInsuranceInput = z.infer<typeof patientHealthInsuranceSchema>;
