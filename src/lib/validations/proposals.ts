import { z } from "zod";

export const proposalStatusEnum = z.enum([
    "draft",
    "sent",
    "won",
    "lost",
    "cancelled",
]);

export const proposalItemSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid("Produto inválido"),
    description: z.string().optional().or(z.literal("")),
    quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
    unitPrice: z.number().int().min(0, "Preço unitário inválido"),
    totalPrice: z.number().int().min(0, "Preço total inválido"),
});

export const createProposalSchema = z.object({
    patientId: z.string().uuid("Selecione um paciente"),
    validUntil: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    paymentTermId: z.string().uuid("Forma de pagamento inválida").optional().or(z.literal("")),
    paymentTermLabel: z.string().max(120, "Forma de pagamento muito longa").optional().or(z.literal("")),
    items: z.array(proposalItemSchema).min(1, "Adicione pelo menos um item"),
});

export const updateProposalSchema = createProposalSchema.extend({
    id: z.string().uuid("Proposta inválida"),
});

export const updateProposalStatusSchema = z.object({
    id: z.string().uuid(),
    status: proposalStatusEnum,
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type ProposalItemInput = z.infer<typeof proposalItemSchema>;
export type UpdateProposalStatusInput = z.infer<typeof updateProposalStatusSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
