import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clinics, scoreItems } from "@/db/schema";
import type { ScoreItemInput } from "@/validations/score-items";

const defaultScoreItems = [
    { name: "Consulta convênio", score: 1 },
    { name: "US tireoide", score: 2 },
    { name: "Consulta particular", score: 3 },
    { name: "US + PAAF", score: 5 },
    { name: "Programa nódulo seguro", score: 8 },
    { name: "Cirurgia convênio", score: 8 },
    { name: "Programa 12M", score: 13 },
    { name: "Programa Hashimoto", score: 21 },
    { name: "Cirurgia particular", score: 55 },
] as const;

export async function seedDefaultScoreItemsForClinic(clinicId: string) {
    await db
        .insert(scoreItems)
        .values(
            defaultScoreItems.map((item) => ({
                clinicId,
                name: item.name,
                description: null,
                score: item.score,
            }))
        )
        .onConflictDoNothing({
            target: [scoreItems.clinicId, scoreItems.name],
        });
}

export async function backfillDefaultScoreItemsForAllClinics() {
    const existingClinics = await db.select({ id: clinics.id }).from(clinics);

    for (const clinic of existingClinics) {
        await seedDefaultScoreItemsForClinic(clinic.id);
    }
}

export async function createScoreItemService(
    clinicId: string,
    data: ScoreItemInput
): Promise<{ success: true } | { success: false; error: string }> {
    const trimmedName = data.name.trim();

    const existing = await db.query.scoreItems.findFirst({
        where: and(eq(scoreItems.clinicId, clinicId), eq(scoreItems.name, trimmedName)),
    });

    if (existing) {
        return { success: false, error: "Já existe uma pontuação com este nome." };
    }

    await db.insert(scoreItems).values({
        clinicId,
        name: trimmedName,
        description: data.description?.trim() || null,
        score: data.score,
    });

    return { success: true };
}

export async function updateScoreItemService(
    clinicId: string,
    id: string,
    data: ScoreItemInput
): Promise<{ success: true } | { success: false; error: string }> {
    const trimmedName = data.name.trim();

    const existing = await db.query.scoreItems.findFirst({
        where: and(
            eq(scoreItems.clinicId, clinicId),
            eq(scoreItems.name, trimmedName),
            ne(scoreItems.id, id)
        ),
    });

    if (existing) {
        return { success: false, error: "Já existe uma pontuação com este nome." };
    }

    const updated = await db
        .update(scoreItems)
        .set({
            name: trimmedName,
            description: data.description?.trim() || null,
            score: data.score,
            updatedAt: new Date(),
        })
        .where(and(eq(scoreItems.id, id), eq(scoreItems.clinicId, clinicId)))
        .returning({ id: scoreItems.id });

    if (!updated.length) {
        return { success: false, error: "Pontuação não encontrada." };
    }

    return { success: true };
}

export async function deleteScoreItemService(
    clinicId: string,
    id: string
): Promise<{ success: true } | { success: false; error: string }> {
    const updated = await db
        .update(scoreItems)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(and(eq(scoreItems.id, id), eq(scoreItems.clinicId, clinicId)))
        .returning({ id: scoreItems.id });

    if (!updated.length) {
        return { success: false, error: "Pontuação não encontrada." };
    }

    return { success: true };
}
