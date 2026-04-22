import { z } from "zod";

export const surgeryStatusSchema = z.enum([
    "scheduled",
    "waiting",
    "in_progress",
    "finished",
    "cancelled",
]);

export type SurgeryStatusValue = z.infer<typeof surgeryStatusSchema>;

export const surgerySaveSchema = z
    .object({
        surgeryId: z.string().uuid(),
        patientId: z.string().uuid(),
        surgeryDate: z.string().optional().nullable(),
        status: surgeryStatusSchema,
        healthInsuranceId: z.union([z.string().uuid(), z.literal("")]).optional(),
        hospitalId: z.union([z.string().uuid(), z.literal("")]).optional(),
        procedureIds: z.array(z.string().uuid()).default([]),
        surgeonId: z.string().uuid({ message: "Selecione o cirurgião" }),
        firstAuxId: z.union([z.string().uuid(), z.literal("")]).optional(),
        secondAuxId: z.union([z.string().uuid(), z.literal("")]).optional(),
        thirdAuxId: z.union([z.string().uuid(), z.literal("")]).optional(),
        anesthetistId: z.union([z.string().uuid(), z.literal("")]).optional(),
        instrumentistId: z.union([z.string().uuid(), z.literal("")]).optional(),
        repasseHospital: z.boolean().default(false),
        repasseAnesthesia: z.boolean().default(false),
        repassePathology: z.boolean().default(false),
        repasseDoctor: z.boolean().default(false),
        repasseInstrumentist: z.boolean().default(false),
        repasseMedicalAux: z.boolean().default(false),
        usesMonitor: z.boolean().default(false),
        cancerDiagnosis: z.boolean().default(false),
        observations: z.string().max(10000).optional().nullable().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
        if (!data.surgeryDate || String(data.surgeryDate).trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe a data da cirurgia",
                path: ["surgeryDate"],
            });
        }
        if (!data.procedureIds || data.procedureIds.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Selecione ao menos um procedimento",
                path: ["procedureIds"],
            });
        }
    });

export const startSurgeryInputSchema = z.object({
    patientId: z.string().uuid(),
    serviceTypeId: z.string().uuid().optional().nullable(),
    healthInsuranceId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export type SurgerySaveInput = z.infer<typeof surgerySaveSchema>;
export type StartSurgeryInput = z.infer<typeof startSurgeryInputSchema>;
