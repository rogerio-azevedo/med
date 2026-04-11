import { z } from "zod";
import { patientHealthInsurancesSchema } from "./health-insurance";

const cpfClean = (v: string) => v?.replace(/\D/g, "") ?? "";

export const createPatientSchema = z.object({
    name: z
        .string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .refine((v) => /[a-zA-ZÀ-ÿ]/.test(v), "Nome deve conter ao menos uma letra"),
    cpf: z
        .string()
        .optional()
        .refine((v) => !v || cpfClean(v).length === 11, "CPF deve ter 11 dígitos"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    sex: z.enum(["M", "F", "other"]).optional(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    responsibleDoctorIds: z.array(z.string().uuid()).optional(),
    originType: z
        .enum(["instagram", "google", "facebook", "friends_family", "medical_referral"])
        .optional(),
    referralDoctorId: z.string().uuid().optional(),
    referralSource: z
        .enum(["patient_reported", "doctor_reported", "invite_link", "manual"])
        .optional(),
    referralNotes: z
        .string()
        .trim()
        .max(1000, "Observação deve ter no máximo 1000 caracteres")
        .optional(),
    patientHealthInsurances: patientHealthInsurancesSchema.optional(),
}).refine(
    (data) => {
        const hasEmail = data.email && data.email.trim().length > 0;
        const hasPhone = data.phone && data.phone.replace(/\D/g, "").length >= 10;
        return hasEmail || hasPhone;
    },
    { message: "Informe ao menos um contato: email ou telefone", path: ["email"] }
).superRefine((data, ctx) => {
    if (data.originType === "medical_referral" && !data.referralDoctorId) {
        ctx.addIssue({
            code: "custom",
            path: ["referralDoctorId"],
            message: "Selecione o médico que indicou o paciente",
        });
    }
});

export const updatePatientSchema = createPatientSchema;

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
