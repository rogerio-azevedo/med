import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { doctorSchedules } from "@/db/schema";

export type ScheduleRow = typeof doctorSchedules.$inferSelect;
export type InsertScheduleRow = typeof doctorSchedules.$inferInsert;

export async function getScheduleByDoctor(doctorId: string, clinicId: string) {
    return db
        .select()
        .from(doctorSchedules)
        .where(
            and(
                eq(doctorSchedules.doctorId, doctorId),
                eq(doctorSchedules.clinicId, clinicId)
            )
        )
        .orderBy(doctorSchedules.weekday, doctorSchedules.startTime);
}

export async function replaceScheduleForDoctor(
    doctorId: string,
    clinicId: string,
    rows: InsertScheduleRow[]
) {
    // Como o driver HTTP do Neon não suporta transações locais (.transaction), 
    // executamos as queries sequencialmente. Isso tem um risco minúsculo de inconsistência 
    // se o servidor cair entre as duas execuções, mas funciona perfeitamente para este caso de uso.

    // Primeiro, removemos todos os horários antigos do médico nesta clínica
    await db.delete(doctorSchedules).where(
        and(
            eq(doctorSchedules.doctorId, doctorId),
            eq(doctorSchedules.clinicId, clinicId)
        )
    );

    // Depois, se houver novas linhas (dias ativos), nós as inserimos
    if (rows.length > 0) {
        await db.insert(doctorSchedules).values(rows);
    }
}
