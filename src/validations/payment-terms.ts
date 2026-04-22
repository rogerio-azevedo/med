import { z } from "zod";

export const paymentMethodSchema = z.enum([
    "pix",
    "credit_card",
    "debit_card",
    "boleto",
    "cash",
]);

export const paymentTermSchema = z.object({
    name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120, "Nome muito longo"),
    paymentMethod: paymentMethodSchema,
    description: z.string().trim().max(500, "Descrição muito longa").optional().or(z.literal("")),
});

export type PaymentTermInput = z.infer<typeof paymentTermSchema>;
