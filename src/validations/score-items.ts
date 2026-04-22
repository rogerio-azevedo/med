import { z } from "zod";

export const scoreItemSchema = z.object({
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
    score: z
        .coerce
        .number({
            message: "Pontuação deve ser um número",
        })
        .int("Pontuação deve ser um número inteiro")
        .min(0, "Pontuação não pode ser negativa"),
});

export type ScoreItemFormInput = z.input<typeof scoreItemSchema>;
export type ScoreItemInput = z.infer<typeof scoreItemSchema>;
