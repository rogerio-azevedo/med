import { and, asc, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { icd10Codes, procedures } from "@/db/schema";

export type ProcedurePayload = {
    type: "general" | "consultation" | "exam" | "therapy" | "hospitalization";
    tussCode?: string;
    name: string;
    description?: string;
    purpose?: string;
    cidId?: string | null;
};

export async function getProcedures(clinicId: string) {
    const procCols = getTableColumns(procedures);
    return db
        .select({
            ...procCols,
            cidCode: icd10Codes.code,
            cidDescription: icd10Codes.description,
        })
        .from(procedures)
        .leftJoin(icd10Codes, eq(procedures.cidId, icd10Codes.id))
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
