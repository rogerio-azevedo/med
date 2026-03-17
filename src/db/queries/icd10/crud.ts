import { db } from "@/db";
import { icd10Codes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createIcd10Code(data: any) {
    return db.insert(icd10Codes).values(data).returning();
}

export async function updateIcd10Code(id: string, data: any) {
    return db
        .update(icd10Codes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(icd10Codes.id, id))
        .returning();
}

export async function deleteIcd10Code(id: string) {
    return db.delete(icd10Codes).where(eq(icd10Codes.id, id));
}
