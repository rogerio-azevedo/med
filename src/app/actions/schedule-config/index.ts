"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
    getScheduleByDoctor,
    replaceScheduleForDoctor,
    type InsertScheduleRow,
} from "@/db/queries/schedule-config";
import { saveScheduleSchema, type DayConfigDraft } from "@/validations/schedule-config";

export async function getScheduleAction(doctorId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const role = session.user.role;
    if (role !== "doctor" && role !== "admin") {
        return { error: "Não autorizado" };
    }

    const rows = await getScheduleByDoctor(doctorId, session.user.clinicId);

    // Transform DB rows back into Draft format
    const draft: DayConfigDraft[] = Array.from({ length: 7 }).map((_, i) => ({
        weekday: i,
        active: false,
        periods: [],
    }));

    for (const row of rows) {
        draft[row.weekday].active = true;

        // Remove seconds from time string, "08:00:00" -> "08:00"
        draft[row.weekday].periods.push({
            id: row.id,
            startTime: row.startTime.slice(0, 5),
            endTime: row.endTime.slice(0, 5),
            slotDurationMin: row.slotDurationMin ?? 30,
        });
    }

    return { success: true, data: draft };
}

export async function saveScheduleAction(doctorId: string, draftData: DayConfigDraft[]) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const role = session.user.role;
    if (role !== "doctor" && role !== "admin") {
        return { error: "Não autorizado" };
    }

    const parsed = saveScheduleSchema.safeParse({
        doctorId,
        days: draftData,
    });

    if (!parsed.success) {
        return { error: "Formato de agenda inválido", details: parsed.error.flatten() };
    }

    const clinicId = session.user.clinicId;

    // Convert draft data into DB rows
    const insertRows: InsertScheduleRow[] = [];

    for (const day of parsed.data.days) {
        if (!day.active) continue;

        for (const p of day.periods) {
            insertRows.push({
                doctorId: doctorId,
                clinicId: clinicId,
                weekday: day.weekday,
                startTime: p.startTime + ":00",
                endTime: p.endTime + ":00",
                slotDurationMin: p.slotDurationMin,
                isActive: true,
            });
        }
    }

    try {
        await replaceScheduleForDoctor(doctorId, clinicId, insertRows);
        revalidatePath("/schedule");
        return { success: true };
    } catch (e: any) {
        console.error("Error saving schedule:", e);
        return { error: "Erro interno ao salvar agenda" };
    }
}
