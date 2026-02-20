import { db } from "../index";
import { specialties } from "../schema";
import { asc, eq } from "drizzle-orm";

export async function getSpecialties() {
    return db.select().from(specialties).orderBy(asc(specialties.name));
}

export async function createSpecialty(data: { name: string; code?: string }) {
    const [newSpecialty] = await db.insert(specialties).values(data).returning();
    return newSpecialty;
}

export async function updateSpecialty(
    id: string,
    data: { name: string; code?: string }
) {
    const [updatedSpecialty] = await db
        .update(specialties)
        .set(data)
        .where(eq(specialties.id, id))
        .returning();
    return updatedSpecialty;
}

export async function deleteSpecialty(id: string) {
    await db.delete(specialties).where(eq(specialties.id, id));
}
