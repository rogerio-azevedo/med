import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { doctorSchedules } from "@/db/schema/medical";
import {
    createAppointment as createAppointmentQuery,
    updateAppointmentStatus as updateAppointmentStatusQuery,
    checkConflict,
    getAppointmentsByClinic,
    getAppointmentById,
    getAppointmentsByDoctor,
} from "@/db/queries/appointments";
import {
    createScheduleBlock as createScheduleBlockQuery,
    deleteScheduleBlock as deleteScheduleBlockQuery,
    getScheduleBlocksByDoctor,
    getAllScheduleBlocksByClinic,
} from "@/db/queries/schedule-blocks";
import type { CreateAppointmentInput } from "@/lib/validations/appointments";
import type { CreateScheduleBlockInput } from "@/lib/validations/schedule-blocks";

export type TimeSlot = {
    startsAt: Date;
    endsAt: Date;
    available: boolean;
};

/**
 * Gera os slots disponíveis para um médico em um dia específico.
 * Considera:
 *  1. A grade semanal do médico (doctor_schedules)
 *  2. Agendamentos existentes (appointments)
 *  3. Bloqueios pontuais (doctor_schedule_blocks)
 */
export async function generateAvailableSlots(
    doctorId: string,
    clinicId: string,
    date: Date
): Promise<TimeSlot[]> {
    const WEEKDAY = date.getDay(); // 0=Dom, 6=Sab

    // 1. Buscar grades do médico para esse dia da semana
    const schedules = await db
        .select()
        .from(doctorSchedules)
        .where(
            and(
                eq(doctorSchedules.doctorId, doctorId),
                eq(doctorSchedules.clinicId, clinicId),
                eq(doctorSchedules.weekday, WEEKDAY),
                eq(doctorSchedules.isActive, true)
            )
        );

    if (schedules.length === 0) return [];

    // 2. Calcular início e fim do dia
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // 3. Buscar agendamentos do dia
    const existingAppointments = await getAppointmentsByDoctor(
        doctorId,
        clinicId,
        dayStart,
        dayEnd
    );

    // 4. Buscar bloqueios que se sobrepõem ao dia
    const blocks = await getScheduleBlocksByDoctor(doctorId, clinicId, dayStart, dayEnd);

    // 5. Gerar todos os slots de todas as grades
    const allSlots: TimeSlot[] = [];

    for (const schedule of schedules) {
        const slotDuration = schedule.slotDurationMin ?? 30;

        // Parsear horário de início e fim
        const [startH, startM] = schedule.startTime.split(":").map(Number);
        const [endH, endM] = schedule.endTime.split(":").map(Number);

        const scheduleStart = new Date(date);
        scheduleStart.setHours(startH, startM, 0, 0);

        const scheduleEnd = new Date(date);
        scheduleEnd.setHours(endH, endM, 0, 0);

        let cursor = new Date(scheduleStart);
        while (cursor < scheduleEnd) {
            const slotEnd = new Date(cursor.getTime() + slotDuration * 60 * 1000);
            if (slotEnd > scheduleEnd) break;

            const slotStart = new Date(cursor);

            // Verificar se o slot colide com um agendamento existente
            const hasAppointment = existingAppointments.some((appt) => {
                if (appt.status === "cancelled" || appt.status === "no_show") return false;
                const apptStart = new Date(appt.scheduledAt);
                const apptEnd = new Date(
                    apptStart.getTime() + appt.durationMinutes * 60 * 1000
                );
                return apptStart < slotEnd && apptEnd > slotStart;
            });

            // Verificar se o slot colide com um bloqueio
            const hasBlock = blocks.some((block) => {
                const blockStart = new Date(block.startsAt);
                const blockEnd = new Date(block.endsAt);
                return blockStart < slotEnd && blockEnd > slotStart;
            });

            allSlots.push({
                startsAt: slotStart,
                endsAt: slotEnd,
                available: !hasAppointment && !hasBlock,
            });

            cursor = slotEnd;
        }
    }

    // Ordenar por horário
    allSlots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return allSlots;
}

export async function createAppointment(
    data: CreateAppointmentInput,
    clinicId: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
    try {
        const startsAt = new Date(data.scheduledAt);
        const hasConflict = await checkConflict(
            data.doctorId,
            clinicId,
            startsAt,
            data.durationMinutes
        );

        if (hasConflict) {
            return {
                success: false,
                error: "Este horário já está ocupado. Por favor, escolha outro slot.",
            };
        }

        const result = await createAppointmentQuery({
            clinicId,
            doctorId: data.doctorId,
            patientId: data.patientId,
            specialtyId: data.specialtyId,
            patientPackageId: data.patientPackageId,
            scheduledAt: startsAt,
            durationMinutes: data.durationMinutes,
            modality: data.modality,
            notes: data.notes,
        });

        return { success: true, id: result.id };
    } catch {
        return { success: false, error: "Erro ao criar agendamento." };
    }
}

export async function updateAppointmentStatus(
    id: string,
    status: "scheduled" | "confirmed" | "in_progress" | "done" | "cancelled" | "no_show",
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await updateAppointmentStatusQuery(id, status, clinicId);
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao atualizar status do agendamento." };
    }
}

export async function createScheduleBlock(
    data: CreateScheduleBlockInput,
    clinicId: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
    try {
        const startsAt = new Date(data.startsAt);
        const endsAt = new Date(data.endsAt);

        const result = await createScheduleBlockQuery({
            doctorId: data.doctorId,
            clinicId,
            reason: data.reason,
            note: data.note,
            startsAt,
            endsAt,
        });

        return { success: true, id: result.id };
    } catch {
        return { success: false, error: "Erro ao criar bloqueio de agenda." };
    }
}

export async function removeScheduleBlock(
    id: string,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await deleteScheduleBlockQuery(id, clinicId);
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao remover bloqueio." };
    }
}

// Re-exports para uso nas actions
export {
    getAppointmentsByClinic,
    getAppointmentById,
    getAppointmentsByDoctor,
    getAllScheduleBlocksByClinic,
    getScheduleBlocksByDoctor,
};
