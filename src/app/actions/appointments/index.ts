"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    createScheduleBlock,
    removeScheduleBlock,
    generateAvailableSlots,
    getAppointmentsByClinic,
    getAppointmentById,
} from "@/services/appointments";
import {
    createAppointmentSchema,
    updateAppointmentStatusSchema,
    updateAppointmentSchema,
} from "@/validations/appointments";
import { createScheduleBlockSchema } from "@/validations/schedule-blocks";
import { getCheckInExistenceForAppointments } from "@/db/queries/check-ins";
import { can } from "@/lib/permissions";

const EDITABLE_STATUSES = ["scheduled", "confirmed"] as const;

function canEditAppointment(params: {
    role: string | undefined;
    clinicRole: string | undefined;
    sessionDoctorId: string | undefined;
    appointmentDoctorId: string;
}): boolean {
    const { role, clinicRole, sessionDoctorId, appointmentDoctorId } = params;
    if (role === "super_admin" || clinicRole === "admin") return true;
    if (role === "doctor" && sessionDoctorId && sessionDoctorId === appointmentDoctorId) {
        return true;
    }
    return false;
}

function canDeleteAppointment(params: {
    role: string | undefined;
    clinicRole: string | undefined;
}): boolean {
    const { role, clinicRole } = params;
    return role === "super_admin" || clinicRole === "admin";
}

export async function createAppointmentAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const raw = {
        patientId: formData.get("patientId"),
        doctorId: formData.get("doctorId"),
        specialtyId: formData.get("specialtyId") || undefined,
        serviceTypeId: formData.get("serviceTypeId") || undefined,
        patientPackageId: formData.get("patientPackageId") || undefined,
        scheduledAt: formData.get("scheduledAt"),
        durationMinutes: Number(formData.get("durationMinutes")),
        modality: formData.get("modality"),
        notes: formData.get("notes") || undefined,
    };

    const parsed = createAppointmentSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const result = await createAppointment(parsed.data, session.user.clinicId);
    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true, id: result.id };
}

export async function updateAppointmentStatusAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const parsed = updateAppointmentStatusSchema.safeParse({
        id: formData.get("id"),
        status: formData.get("status"),
    });

    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const result = await updateAppointmentStatus(
        parsed.data.id,
        parsed.data.status,
        session.user.clinicId
    );
    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true };
}

export async function cancelAppointmentAction(id: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const result = await updateAppointmentStatus(id, "cancelled", session.user.clinicId);
    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true };
}

export async function updateAppointmentAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const raw = {
        id: formData.get("id"),
        patientId: formData.get("patientId"),
        doctorId: formData.get("doctorId"),
        specialtyId: formData.get("specialtyId") || undefined,
        serviceTypeId: formData.get("serviceTypeId") || undefined,
        scheduledAt: formData.get("scheduledAt"),
        durationMinutes: Number(formData.get("durationMinutes")),
        modality: formData.get("modality"),
        notes: formData.get("notes") || undefined,
    };

    const parsed = updateAppointmentSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const existing = await getAppointmentById(parsed.data.id, session.user.clinicId);
    if (!existing) {
        return { error: "Agendamento não encontrado." };
    }

    const st = existing.status ?? "scheduled";
    if (!EDITABLE_STATUSES.includes(st as (typeof EDITABLE_STATUSES)[number])) {
        return { error: "Só é possível editar agendamentos agendados ou confirmados." };
    }

    if (
        !canEditAppointment({
            role: session.user.role,
            clinicRole: session.user.clinicRole,
            sessionDoctorId: session.user.doctorId,
            appointmentDoctorId: existing.doctorId,
        })
    ) {
        return { error: "Não autorizado a editar este agendamento." };
    }

    const result = await updateAppointment(
        parsed.data.id,
        {
            doctorId: parsed.data.doctorId,
            patientId: parsed.data.patientId,
            specialtyId: parsed.data.specialtyId,
            ...(parsed.data.serviceTypeId !== undefined
                ? { serviceTypeId: parsed.data.serviceTypeId ?? null }
                : {}),
            scheduledAt: parsed.data.scheduledAt,
            durationMinutes: parsed.data.durationMinutes,
            modality: parsed.data.modality,
            notes: parsed.data.notes,
        },
        session.user.clinicId
    );

    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true };
}

export async function deleteAppointmentAction(id: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    if (
        !canDeleteAppointment({
            role: session.user.role,
            clinicRole: session.user.clinicRole,
        })
    ) {
        return { error: "Apenas administradores podem excluir agendamentos." };
    }

    const existing = await getAppointmentById(id, session.user.clinicId);
    if (!existing) {
        return { error: "Agendamento não encontrado." };
    }

    const st = existing.status ?? "scheduled";
    if (!EDITABLE_STATUSES.includes(st as (typeof EDITABLE_STATUSES)[number])) {
        return { error: "Só é possível excluir agendamentos agendados ou confirmados." };
    }

    const result = await deleteAppointment(id, session.user.clinicId);
    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true };
}

export async function createScheduleBlockAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    // Only doctors and admins can block schedules
    const role = session.user.role;
    if (role !== "doctor" && role !== "admin" && role !== "receptionist") {
        return { error: "Não autorizado" };
    }

    const raw = {
        doctorId: formData.get("doctorId"),
        reason: formData.get("reason"),
        note: formData.get("note") || undefined,
        startsAt: formData.get("startsAt"),
        endsAt: formData.get("endsAt"),
    };

    const parsed = createScheduleBlockSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const result = await createScheduleBlock(parsed.data, session.user.clinicId);
    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true, id: result.id };
}

export async function deleteScheduleBlockAction(id: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const result = await removeScheduleBlock(id, session.user.clinicId);
    if (!result.success) return { error: result.error };

    revalidatePath("/schedule");
    return { success: true };
}

export async function listScheduleAppointmentsAction(startIso: string, endIso: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return { error: "Período inválido" };
    }

    const clinicId = session.user.clinicId;

    const rows = await getAppointmentsByClinic(clinicId, {
        startDate,
        endDate,
    });

    // Detectar check-ins existentes (só se o usuário tem permissão de check-in)
    const canQuickCheckIn = await can("checkins", "can_read");
    const existingCheckInIds = canQuickCheckIn
        ? await getCheckInExistenceForAppointments(
              clinicId,
              rows.map((a) => ({
                  id: a.id,
                  patientId: a.patient.id,
                  doctorId: a.doctor.id,
                  scheduledAt: a.scheduledAt,
              }))
          )
        : new Set<string>();

    return {
        success: true as const,
        appointments: rows.map((a) => ({
            id: a.id,
            scheduledAt: a.scheduledAt,
            durationMinutes: a.durationMinutes,
            modality: a.modality,
            status: a.status ?? "scheduled",
            notes: a.notes,
            doctor: { id: a.doctor.id, name: a.doctor.name ?? null },
            patient: { id: a.patient.id, name: a.patient.name, phone: a.patient.phone },
            specialty: a.specialty?.id ? { id: a.specialty.id, name: a.specialty.name } : null,
            serviceType:
                a.serviceType?.id && a.serviceType.name
                    ? {
                          id: a.serviceType.id,
                          name: a.serviceType.name,
                          workflow: a.serviceType.workflow,
                          timelineIconKey: a.serviceType.timelineIconKey,
                          timelineColorHex: a.serviceType.timelineColorHex,
                      }
                    : null,
            hasCheckIn: existingCheckInIds.has(a.id),
        })),
    };
}

export async function getAvailableSlotsAction(
    doctorId: string,
    dateStr: string,
    timeZone: string,
    excludeAppointmentId?: string
) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const slots = await generateAvailableSlots(
        doctorId,
        session.user.clinicId,
        dateStr,
        timeZone,
        excludeAppointmentId
    );
    return { success: true, slots };
}
