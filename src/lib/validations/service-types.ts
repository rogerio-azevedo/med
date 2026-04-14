import { z } from "zod";

export const serviceTypeSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(120, "Nome muito longo"),
    description: z
        .string()
        .trim()
        .max(500, "Descrição muito longa")
        .optional()
        .or(z.literal("")),
});

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;
