import { z } from "zod";

export const productTypeEnum = z.enum([
    "plan_package",
    "surgery",
    "exam",
    "consultation",
    "other",
]);

const productFieldsSchema = z.object({
    type: productTypeEnum,
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional().nullable(),
    costPrice: z.number().int().min(0, "Custo inválido"),
    sellingPrice: z.number().int().min(0, "Preço de venda inválido"),
    isActive: z.boolean(),
    /** Meses de duração; obrigatório para `plan_package` na UI. */
    durationMonths: z
        .number()
        .int()
        .min(1)
        .max(120)
        .optional()
        .nullable(),
});

export const createProductSchema = productFieldsSchema.superRefine((data, ctx) => {
    if (data.type === "plan_package") {
        if (data.durationMonths == null || data.durationMonths < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe a duração em meses para Plano/Pacote",
                path: ["durationMonths"],
            });
        }
    }
});

export const updateProductSchema = productFieldsSchema.partial().superRefine((data, ctx) => {
    if (data.type === "plan_package") {
        if (data.durationMonths == null || data.durationMonths < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe a duração em meses para Plano/Pacote",
                path: ["durationMonths"],
            });
        }
    }
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
