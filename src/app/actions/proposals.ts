"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
    getProposals,
    getProposalById,
    createProposal,
    updateProposalStatus,
    getProposalStats,
    getNextProposalNumber,
    updateProposal,
} from "@/db/queries/proposals";
import { getPaymentTermById } from "@/db/queries/payment-terms";
import { proposalItems } from "@/db/schema";
import {
    createProposalSchema,
    updateProposalStatusSchema,
    updateProposalSchema,
    CreateProposalInput,
    UpdateProposalInput,
} from "@/lib/validations/proposals";

type ProposalItemPayload = Omit<typeof proposalItems.$inferInsert, "proposalId">;

export async function getProposalsAction() {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        const data = await getProposals(session.user.clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar propostas" };
    }
}

export async function createProposalAction(data: CreateProposalInput) {
    const session = await auth();
    if (!session?.user?.clinicId || !session?.user?.id) {
        return { success: false, error: "Não autorizado" };
    }

    const validated = createProposalSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Dados inválidos", details: validated.error.flatten() };
    }

    try {
        const nextNumber = await getNextProposalNumber(session.user.clinicId);
        const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const paymentTerm = data.paymentTermId
            ? await getPaymentTermById(data.paymentTermId, session.user.clinicId)
            : null;

        if (data.paymentTermId && !paymentTerm) {
            return { success: false, error: "Forma de pagamento inválida" };
        }

        const newProposal = await createProposal(
            {
                clinicId: session.user.clinicId,
                patientId: data.patientId,
                number: nextNumber,
                status: "sent", // Start as sent for a realistic flow, or "draft" if preferred.
                totalAmount,
                notes: data.notes || null,
                judicialSummary: data.judicialSummary?.trim() || null,
                validUntil: data.validUntil || null,
                paymentTermId: paymentTerm?.id || null,
                paymentTermLabel: paymentTerm?.name || data.paymentTermLabel || null,
                createdById: session.user.id,
            },
            data.items.map<ProposalItemPayload>((item) => ({
                productId: item.productId,
                description: item.description || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                // proposalId is added in query transaction
            }))
        );

        revalidatePath("/proposals");
        return { success: true, data: newProposal };
    } catch (error) {
        console.error("Error creating proposal:", error);
        return { success: false, error: "Erro ao criar proposta" };
    }
}

export async function getProposalDetailAction(id: string) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        const data = await getProposalById(id, session.user.clinicId);

        if (!data) {
            return { success: false, error: "Proposta não encontrada" };
        }

        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar proposta" };
    }
}

export async function getProposalPrintDataAction(id: string) {
    return getProposalDetailAction(id);
}

export async function updateProposalAction(data: UpdateProposalInput) {
    const session = await auth();
    if (!session?.user?.clinicId || !session?.user?.id) {
        return { success: false, error: "Não autorizado" };
    }

    const validated = updateProposalSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Dados inválidos", details: validated.error.flatten() };
    }

    try {
        const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const paymentTerm = data.paymentTermId
            ? await getPaymentTermById(data.paymentTermId, session.user.clinicId)
            : null;

        if (data.paymentTermId && !paymentTerm) {
            return { success: false, error: "Forma de pagamento inválida" };
        }

        const updatedProposal = await updateProposal(
            data.id,
            session.user.clinicId,
            {
                patientId: data.patientId,
                totalAmount,
                notes: data.notes || null,
                judicialSummary: data.judicialSummary?.trim() || null,
                validUntil: data.validUntil || null,
                paymentTermId: paymentTerm?.id || null,
                paymentTermLabel: paymentTerm?.name || data.paymentTermLabel || null,
            },
            data.items.map<ProposalItemPayload>((item) => ({
                productId: item.productId,
                description: item.description || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            }))
        );

        revalidatePath("/proposals");
        revalidatePath(`/proposals/${data.id}`);
        revalidatePath(`/proposals/${data.id}/print`);
        return { success: true, data: updatedProposal };
    } catch (error) {
        console.error("Error updating proposal:", error);
        return { success: false, error: "Erro ao atualizar proposta" };
    }
}

export async function updateProposalStatusAction(id: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Não autorizado" };
    }

    const validated = updateProposalStatusSchema.safeParse({ id, status });
    if (!validated.success) {
        return { success: false, error: "Status inválido" };
    }

    try {
        const updated = await updateProposalStatus(id, validated.data.status, session.user.id);
        revalidatePath("/proposals");
        revalidatePath(`/proposals/${id}`);
        revalidatePath(`/proposals/${id}/print`);
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating proposal status:", error);
        return { success: false, error: "Erro ao atualizar status" };
    }
}

export async function getProposalStatsAction() {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        const data = await getProposalStats(session.user.clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar estatísticas" };
    }
}
