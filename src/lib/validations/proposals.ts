import { z } from "zod";

export const proposalStatusEnum = z.enum([
    "draft",
    "sent",
    "won",
    "lost",
    "cancelled",
]);

export const proposalItemSchema = z.object({
    productId: z.string().uuid("Produto inválido"),
    description: z.string().optional(),
    quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
    unitPrice: z.number().int().min(0, "Preço unitário inválido"),
    totalPrice: z.number().int().min(0, "Preço total inválido"),
});

export const createProposalSchema = z.object({
    patientId: z.string().uuid("Selecione um paciente"),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(proposalItemSchema).min(1, "Adicione pelo menos um item"),
});

export const updateProposalStatusSchema = z.object({
    id: z.string().uuid(),
    status: proposalStatusEnum,
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type ProposalItemInput = z.infer<typeof proposalItemSchema>;
export type UpdateProposalStatusInput = z.infer<typeof updateProposalStatusSchema>;
