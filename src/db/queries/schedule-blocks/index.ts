import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { doctorScheduleBlocks } from "@/db/schema";

export async function getScheduleBlocksByDoctor(
    doctorId: string,
    clinicId: string,
    startDate: Date,
    endDate: Date
) {
    return db
        .select()
        .from(doctorScheduleBlocks)
        .where(
            and(
                eq(doctorScheduleBlocks.doctorId, doctorId),
                eq(doctorScheduleBlocks.clinicId, clinicId),
                // Bloqueios que se sobrepõem ao período consultado
                lte(doctorScheduleBlocks.startsAt, endDate),
                gte(doctorScheduleBlocks.endsAt, startDate)
            )
        )
        .orderBy(doctorScheduleBlocks.startsAt);
}

export async function getAllScheduleBlocksByClinic(
    clinicId: string,
    startDate: Date,
    endDate: Date
) {
    return db
        .select()
        .from(doctorScheduleBlocks)
        .where(
            and(
                eq(doctorScheduleBlocks.clinicId, clinicId),
                lte(doctorScheduleBlocks.startsAt, endDate),
                gte(doctorScheduleBlocks.endsAt, startDate)
            )
        )
        .orderBy(doctorScheduleBlocks.startsAt);
}

export async function createScheduleBlock(data: {
    doctorId: string;
    clinicId: string;
    reason: "vacation" | "sick_leave" | "conference" | "personal" | "holiday" | "other";
    note?: string;
    startsAt: Date;
    endsAt: Date;
}) {
    const result = await db
        .insert(doctorScheduleBlocks)
        .values(data)
        .returning({ id: doctorScheduleBlocks.id });
    return result[0];
}

export async function deleteScheduleBlock(id: string, clinicId: string) {
    return db
        .delete(doctorScheduleBlocks)
        .where(
            and(
                eq(doctorScheduleBlocks.id, id),
                eq(doctorScheduleBlocks.clinicId, clinicId)
            )
        );
}
