import { db } from "../index";
import { practiceAreas } from "../schema";
import { asc, eq } from "drizzle-orm";

export async function getPracticeAreas() {
    return db.select().from(practiceAreas).orderBy(asc(practiceAreas.name));
}

export async function createPracticeArea(data: { name: string; code?: string }) {
    const [newPracticeArea] = await db.insert(practiceAreas).values(data).returning();
    return newPracticeArea;
}

export async function updatePracticeArea(
    id: string,
    data: { name: string; code?: string }
) {
    const [updatedPracticeArea] = await db
        .update(practiceAreas)
        .set(data)
        .where(eq(practiceAreas.id, id))
        .returning();
    return updatedPracticeArea;
}

export async function deletePracticeArea(id: string) {
    await db.delete(practiceAreas).where(eq(practiceAreas.id, id));
}
