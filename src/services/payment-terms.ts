import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { paymentTerms, proposals } from "@/db/schema";
import type { PaymentTermInput } from "@/validations/payment-terms";

export async function createPaymentTermService(
    clinicId: string,
    data: PaymentTermInput
): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await db.query.paymentTerms.findFirst({
        where: and(
            eq(paymentTerms.clinicId, clinicId),
            eq(paymentTerms.name, data.name.trim())
        ),
    });

    if (existing) {
        return { success: false, error: "Já existe uma condição de pagamento com este nome." };
    }

    await db.insert(paymentTerms).values({
        clinicId,
        name: data.name.trim(),
        paymentMethod: data.paymentMethod,
        description: data.description?.trim() || null,
    });

    return { success: true };
}

export async function updatePaymentTermService(
    clinicId: string,
    id: string,
    data: PaymentTermInput
): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await db.query.paymentTerms.findFirst({
        where: and(
            eq(paymentTerms.clinicId, clinicId),
            eq(paymentTerms.name, data.name.trim()),
            ne(paymentTerms.id, id)
        ),
    });

    if (existing) {
        return { success: false, error: "Já existe uma condição de pagamento com este nome." };
    }

    const updated = await db
        .update(paymentTerms)
        .set({
            name: data.name.trim(),
            paymentMethod: data.paymentMethod,
            description: data.description?.trim() || null,
            updatedAt: new Date(),
        })
        .where(and(eq(paymentTerms.id, id), eq(paymentTerms.clinicId, clinicId)))
        .returning({ id: paymentTerms.id });

    if (!updated.length) {
        return { success: false, error: "Condição de pagamento não encontrada." };
    }

    return { success: true };
}

export async function deletePaymentTermService(
    clinicId: string,
    id: string
): Promise<{ success: true; linked: boolean } | { success: false; error: string }> {
    const linked = Boolean(
        await db.query.proposals.findFirst({
            where: and(eq(proposals.clinicId, clinicId), eq(proposals.paymentTermId, id)),
        })
    );

    const updated = await db
        .update(paymentTerms)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(and(eq(paymentTerms.id, id), eq(paymentTerms.clinicId, clinicId)))
        .returning({ id: paymentTerms.id });

    if (!updated.length) {
        return { success: false, error: "Condição de pagamento não encontrada." };
    }

    return { success: true, linked };
}
