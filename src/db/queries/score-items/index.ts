import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scoreItems } from "@/db/schema";

export async function getScoreItems(clinicId: string) {
    return db
        .select()
        .from(scoreItems)
        .where(eq(scoreItems.clinicId, clinicId))
        .orderBy(asc(scoreItems.score), asc(scoreItems.name));
}

export async function getActiveScoreItems(clinicId: string) {
    return db
        .select()
        .from(scoreItems)
        .where(and(eq(scoreItems.clinicId, clinicId), eq(scoreItems.isActive, true)))
        .orderBy(asc(scoreItems.score), asc(scoreItems.name));
}

export async function getScoreItemById(id: string, clinicId: string) {
    return db.query.scoreItems.findFirst({
        where: and(eq(scoreItems.id, id), eq(scoreItems.clinicId, clinicId)),
    });
}
