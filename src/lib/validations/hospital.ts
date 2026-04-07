import { z } from "zod";

export const hospitalSchema = z.object({
    name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(255, "Nome muito longo"),
    description: z.string().trim().max(1000, "Descrição muito longa").optional().or(z.literal("")),
    zipCode: z.string().trim().max(9, "CEP inválido").optional().or(z.literal("")),
    street: z.string().trim().max(255, "Logradouro muito longo").optional().or(z.literal("")),
    number: z.string().trim().max(20, "Número muito longo").optional().or(z.literal("")),
    complement: z.string().trim().max(100, "Complemento muito longo").optional().or(z.literal("")),
    neighborhood: z.string().trim().max(100, "Bairro muito longo").optional().or(z.literal("")),
    city: z.string().trim().max(100, "Cidade muito longa").optional().or(z.literal("")),
    state: z.string().trim().max(2, "UF inválida").optional().or(z.literal("")),
});

export type HospitalInput = z.infer<typeof hospitalSchema>;
