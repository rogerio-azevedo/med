"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPaymentTerms, getActivePaymentTerms } from "@/db/queries/payment-terms";
import { paymentTermSchema } from "@/lib/validations/payment-terms";
import {
    createPaymentTermService,
    deletePaymentTermService,
    updatePaymentTermService,
} from "@/services/payment-terms";

function getFirstError(error: z.ZodError) {
    const flattened = z.flattenError(error);
    return Object.values(flattened.fieldErrors).flat().find(Boolean);
}

export async function getPaymentTermsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getPaymentTerms(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar condições de pagamento" };
    }
}

export async function getActivePaymentTermsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getActivePaymentTerms(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar condições de pagamento" };
    }
}

export async function createPaymentTermAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = paymentTermSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await createPaymentTermService(clinicId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/payment-terms");
    revalidatePath("/proposals");
    return { success: true };
}

export async function updatePaymentTermAction(id: string, data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = paymentTermSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await updatePaymentTermService(clinicId, id, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/payment-terms");
    revalidatePath("/proposals");
    return { success: true };
}

export async function deletePaymentTermAction(id: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const result = await deletePaymentTermService(clinicId, id);
    if (!result.success) {
        return result;
    }

    revalidatePath("/payment-terms");
    revalidatePath("/proposals");
    return {
        success: true,
        message: result.linked
            ? "Condição de pagamento inativada porque já está vinculada a propostas."
            : "Condição de pagamento removida com sucesso.",
    };
}
