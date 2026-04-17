import * as z from "zod";

export const procedureFormSchema = z.object({
    type: z.enum(["general", "consultation", "exam", "therapy", "hospitalization"], {
        error: "Selecione o tipo do procedimento",
    }),
    tussCode: z.string().trim().max(50, "Código TUSS deve ter no máximo 50 caracteres").optional(),
    name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(255, "Nome deve ter no máximo 255 caracteres"),
    description: z.string().trim().max(2000, "Descrição deve ter no máximo 2000 caracteres").optional(),
    purpose: z.string().trim().max(255, "Finalidade deve ter no máximo 255 caracteres").optional(),
    cidId: z.union([z.string().uuid("Selecione um CID válido na lista"), z.null()]).optional(),
    cidMetaCode: z.string().optional(),
    cidMetaDescription: z.string().optional(),
});

export type ProcedureFormValues = z.infer<typeof procedureFormSchema>;
