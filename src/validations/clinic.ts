import { z } from "zod";

export const createClinicSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres").optional(),
});

export const updateClinicSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    cnpj: z.string().optional(),
    /** OBS / condições gerais no PDF de propostas; vazio = padrão do sistema. */
    proposalGeneralNotes: z.string().max(20000, "Texto muito longo").optional(),
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
