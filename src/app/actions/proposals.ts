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
} from "@/db/queries/proposals";
import {
    createProposalSchema,
    updateProposalStatusSchema,
    CreateProposalInput,
} from "@/lib/validations/proposals";
import { redirect } from "next/navigation";

export async function getProposalsAction() {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        const data = await getProposals(session.user.clinicId);
        return { success: true, data };
    } catch (error) {
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

        const newProposal = await createProposal(
            {
                clinicId: session.user.clinicId,
                patientId: data.patientId,
                number: nextNumber,
                status: "sent", // Start as sent for a realistic flow, or "draft" if preferred.
                totalAmount,
                notes: data.notes,
                validUntil: data.validUntil,
                createdById: session.user.id,
            },
            data.items.map((item) => ({
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                // proposalId is added in query transaction
            })) as any
        );

        revalidatePath("/proposals");
        return { success: true, data: newProposal };
    } catch (error) {
        console.error("Error creating proposal:", error);
        return { success: false, error: "Erro ao criar proposta" };
    }
}

export async function updateProposalStatusAction(id: string, status: any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        const updated = await updateProposalStatus(id, status, session.user.id);
        revalidatePath("/proposals");
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
    } catch (error) {
        return { success: false, error: "Erro ao carregar estatísticas" };
    }
}
