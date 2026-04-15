"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
    createAppointment,
    updateAppointmentStatus,
    createScheduleBlock,
    removeScheduleBlock,
    generateAvailableSlots,
    getAppointmentsByClinic,
} from "@/services/appointments";
import {
    createAppointmentSchema,
    updateAppointmentStatusSchema,
} from "@/lib/validations/appointments";
import { createScheduleBlockSchema } from "@/lib/validations/schedule-blocks";

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

    const rows = await getAppointmentsByClinic(session.user.clinicId, {
        startDate,
        endDate,
    });

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
        })),
    };
}

export async function getAvailableSlotsAction(
    doctorId: string,
    dateStr: string,
    timeZone: string
) {
    const session = await auth();
    if (!session?.user?.clinicId) return { error: "Não autorizado" };

    const slots = await generateAvailableSlots(doctorId, session.user.clinicId, dateStr, timeZone);
    return { success: true, slots };
}
