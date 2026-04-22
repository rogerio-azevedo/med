import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import { doctorSchedules } from "@/db/schema";
import { getServiceTypeById } from "@/db/queries/service-types";
import {
    createAppointment as createAppointmentQuery,
    updateAppointment as updateAppointmentQuery,
    updateAppointmentStatus as updateAppointmentStatusQuery,
    deleteAppointment as deleteAppointmentQuery,
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
import type { CreateAppointmentInput } from "@/validations/appointments";
import type { CreateScheduleBlockInput } from "@/validations/schedule-blocks";
import type { UpdateIntegrationAppointmentInput } from "@/validations/integration-appointments";

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
    dateStr: string,
    timeZone: string,
    /** Ignora este agendamento ao marcar slots ocupados (edição na mesma data/hora). */
    excludeAppointmentId?: string
): Promise<TimeSlot[]> {
    // Pega o número do dia da semana (0=Dom...6=Sab).
    // Construindo a string como UTC garantimos que não sofra offset do servidor
    const utcDate = new Date(`${dateStr}T00:00:00Z`);
    const WEEKDAY = utcDate.getUTCDay();

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

    // 2. Calcular início e fim do dia referenciado no fuso especificado!
    // Usando fromZonedTime do date-fns-tz garantimos não depender do fuso nativo do container
    const dayStart = fromZonedTime(`${dateStr}T00:00:00`, timeZone);
    const dayEnd = fromZonedTime(`${dateStr}T23:59:59.999`, timeZone);

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

        // Construir inícios e fins absolutos considerando o timezone passado
        const scheduleStart = fromZonedTime(`${dateStr}T${schedule.startTime}`, timeZone);
        const scheduleEnd = fromZonedTime(`${dateStr}T${schedule.endTime}`, timeZone);

        let cursor = new Date(scheduleStart);
        while (cursor < scheduleEnd) {
            const slotEnd = new Date(cursor.getTime() + slotDuration * 60 * 1000);
            if (slotEnd > scheduleEnd) break;

            const slotStart = new Date(cursor);

            // Verificar se o slot colide com um agendamento existente
            const hasAppointment = existingAppointments.some((appt) => {
                if (excludeAppointmentId && appt.id === excludeAppointmentId) return false;
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

        if (data.serviceTypeId) {
            const st = await getServiceTypeById(data.serviceTypeId, clinicId);
            if (!st) {
                return { success: false, error: "Tipo de atendimento inválido para esta clínica." };
            }
        }

        const result = await createAppointmentQuery({
            clinicId,
            doctorId: data.doctorId,
            patientId: data.patientId,
            specialtyId: data.specialtyId,
            serviceTypeId: data.serviceTypeId ?? null,
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

export async function updateAppointment(
    id: string,
    data: UpdateIntegrationAppointmentInput,
    clinicId: string
): Promise<
    | {
          success: true;
          appointment: {
              id: string;
              status: string | null;
              scheduledAt: Date;
              durationMinutes: number;
              doctorId: string;
              patientId: string;
          };
      }
    | { success: false; error: string }
> {
    try {
        const startsAt = new Date(data.scheduledAt);
        const hasConflict = await checkConflict(
            data.doctorId,
            clinicId,
            startsAt,
            data.durationMinutes,
            id
        );

        if (hasConflict) {
            return {
                success: false,
                error: "Este horário já está ocupado. Por favor, escolha outro slot.",
            };
        }

        if (data.serviceTypeId) {
            const st = await getServiceTypeById(data.serviceTypeId, clinicId);
            if (!st) {
                return { success: false, error: "Tipo de atendimento inválido para esta clínica." };
            }
        }

        const result = await updateAppointmentQuery(id, clinicId, {
            doctorId: data.doctorId,
            patientId: data.patientId,
            specialtyId: data.specialtyId,
            ...(data.serviceTypeId !== undefined ? { serviceTypeId: data.serviceTypeId } : {}),
            scheduledAt: startsAt,
            durationMinutes: data.durationMinutes,
            modality: data.modality,
            notes: data.notes,
        });

        if (!result) {
            return { success: false, error: "Agendamento não encontrado." };
        }

        return { success: true, appointment: result };
    } catch {
        return { success: false, error: "Erro ao atualizar agendamento." };
    }
}

const EDITABLE_APPOINTMENT_STATUSES = ["scheduled", "confirmed"] as const;

export async function deleteAppointment(
    id: string,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const existing = await getAppointmentById(id, clinicId);
        if (!existing) {
            return { success: false, error: "Agendamento não encontrado." };
        }
        const st = existing.status ?? "scheduled";
        if (!EDITABLE_APPOINTMENT_STATUSES.includes(st as (typeof EDITABLE_APPOINTMENT_STATUSES)[number])) {
            return {
                success: false,
                error: "Só é possível excluir agendamentos agendados ou confirmados.",
            };
        }
        await deleteAppointmentQuery(id, clinicId);
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao excluir agendamento." };
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
