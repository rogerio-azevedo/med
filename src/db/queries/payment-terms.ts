import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentTerms } from "@/db/schema";

export async function getPaymentTerms(clinicId: string) {
    return db
        .select()
        .from(paymentTerms)
        .where(eq(paymentTerms.clinicId, clinicId))
        .orderBy(asc(paymentTerms.name));
}

export async function getActivePaymentTerms(clinicId: string) {
    return db
        .select()
        .from(paymentTerms)
        .where(and(eq(paymentTerms.clinicId, clinicId), eq(paymentTerms.isActive, true)))
        .orderBy(asc(paymentTerms.name));
}

export async function getPaymentTermById(id: string, clinicId: string) {
    return db.query.paymentTerms.findFirst({
        where: and(eq(paymentTerms.id, id), eq(paymentTerms.clinicId, clinicId)),
    });
}
