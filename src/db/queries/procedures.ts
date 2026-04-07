import { asc, eq } from "drizzle-orm";
import { db } from "../index";
import { procedures } from "../schema";

export type ProcedurePayload = {
    type: "general" | "consultation" | "exam" | "therapy" | "hospitalization";
    tussCode?: string;
    name: string;
    description?: string;
    purpose?: string;
};

export async function getProcedures() {
    return db.select().from(procedures).orderBy(asc(procedures.name));
}

export async function createProcedure(data: ProcedurePayload) {
    const [newProcedure] = await db.insert(procedures).values(data).returning();
    return newProcedure;
}

export async function updateProcedure(id: string, data: ProcedurePayload) {
    const [updatedProcedure] = await db
        .update(procedures)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(procedures.id, id))
        .returning();

    return updatedProcedure;
}

export async function deleteProcedure(id: string) {
    await db.delete(procedures).where(eq(procedures.id, id));
}
