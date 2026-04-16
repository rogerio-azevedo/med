import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { procedures } from "../schema";

export type ProcedurePayload = {
    type: "general" | "consultation" | "exam" | "therapy" | "hospitalization";
    tussCode?: string;
    name: string;
    description?: string;
    purpose?: string;
};

export async function getProcedures(clinicId: string) {
    return db
        .select()
        .from(procedures)
        .where(eq(procedures.clinicId, clinicId))
        .orderBy(asc(procedures.name));
}

export async function createProcedure(clinicId: string, data: ProcedurePayload) {
    const [newProcedure] = await db
        .insert(procedures)
        .values({ ...data, clinicId })
        .returning();
    return newProcedure;
}

export async function updateProcedure(id: string, clinicId: string, data: ProcedurePayload) {
    const [updatedProcedure] = await db
        .update(procedures)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(procedures.id, id), eq(procedures.clinicId, clinicId)))
        .returning();

    return updatedProcedure;
}

export async function deleteProcedure(id: string, clinicId: string) {
    await db.delete(procedures).where(and(eq(procedures.id, id), eq(procedures.clinicId, clinicId)));
}
