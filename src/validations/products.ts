import { z } from "zod";

export const productTypeEnum = z.enum([
    "plan_package",
    "surgery",
    "exam",
    "consultation",
    "other",
]);

export const createProductSchema = z.object({
    type: productTypeEnum,
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional().nullable(),
    costPrice: z.number().int().min(0, "Custo inválido"),
    sellingPrice: z.number().int().min(0, "Preço de venda inválido"),
    isActive: z.boolean(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
