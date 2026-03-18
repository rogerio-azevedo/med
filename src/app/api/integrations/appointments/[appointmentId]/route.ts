import { NextRequest, NextResponse } from "next/server";
import {
    getAppointmentById,
    updateAppointment,
    updateAppointmentStatus,
} from "@/services/appointments";
import {
    appointmentBelongsToClinic,
    authenticateAppointmentIntegrationToken,
    doctorBelongsToClinic,
    findDoctorByClinicAndCrm,
    findPatientByClinicAndCpf,
    findPatientByClinicAndId,
    specialtyExists,
} from "@/services/appointment-integrations";
import { patchIntegrationAppointmentSchema } from "@/lib/validations/integration-appointments";

type RouteContext = { params: Promise<{ appointmentId: string }> };

function buildSuccessPayload(appointment: {
    id: string;
    status: string | null;
    scheduledAt: Date;
    durationMinutes: number;
    doctorId: string;
    patientId: string;
}) {
    return {
        id: appointment.id,
        status: appointment.status ?? "scheduled",
        scheduledAt: appointment.scheduledAt.toISOString(),
        durationMinutes: appointment.durationMinutes,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
    };
}

async function authenticateRequest(request: NextRequest) {
    const authResult = await authenticateAppointmentIntegrationToken(
        request.headers.get("authorization")
    );

    if (!authResult.ok) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    return authResult;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
        return authResult;
    }

    const { appointmentId } = await context.params;
    const clinicId = authResult.integration.clinicId;
    const existingAppointment = await getAppointmentById(appointmentId, clinicId);

    if (!existingAppointment) {
        return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "JSON inválido." }, { status: 422 });
    }

    const parsed = patchIntegrationAppointmentSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Payload inválido.",
                details: parsed.error.flatten(),
            },
            { status: 422 }
        );
    }

    const nextDoctor = parsed.data.doctorId
        ? (await doctorBelongsToClinic(parsed.data.doctorId, clinicId))
            ? { id: parsed.data.doctorId }
            : null
        : parsed.data.doctorCrm && parsed.data.doctorCrmState
          ? await findDoctorByClinicAndCrm(
                parsed.data.doctorCrm,
                parsed.data.doctorCrmState,
                clinicId
            )
          : { id: existingAppointment.doctorId };

    if (!nextDoctor) {
        return NextResponse.json(
            { error: "Médico não encontrado para esta clínica." },
            { status: 404 }
        );
    }

    let nextPatientId = existingAppointment.patientId;
    if (parsed.data.patientId) {
        const patient = await findPatientByClinicAndId(parsed.data.patientId, clinicId);
        if (!patient) {
            return NextResponse.json(
                { error: "Paciente não encontrado para esta clínica." },
                { status: 404 }
            );
        }
        nextPatientId = patient.id;
    } else if (parsed.data.patientCpf) {
        const patient = await findPatientByClinicAndCpf(parsed.data.patientCpf, clinicId);
        if (!patient) {
            return NextResponse.json(
                { error: "Paciente não encontrado para esta clínica." },
                { status: 404 }
            );
        }
        nextPatientId = patient.id;
    }

    const nextSpecialtyId =
        parsed.data.specialtyId === null
            ? undefined
            : parsed.data.specialtyId ?? existingAppointment.specialtyId ?? undefined;

    if (nextSpecialtyId && !(await specialtyExists(nextSpecialtyId))) {
        return NextResponse.json(
            { error: "Especialidade não encontrada." },
            { status: 404 }
        );
    }

    const result = await updateAppointment(
        appointmentId,
        {
            doctorId: nextDoctor.id,
            patientId: nextPatientId,
            specialtyId: nextSpecialtyId,
            scheduledAt: parsed.data.scheduledAt ?? new Date(existingAppointment.scheduledAt).toISOString(),
            durationMinutes:
                parsed.data.durationMinutes ?? existingAppointment.durationMinutes,
            modality: parsed.data.modality ?? existingAppointment.modality,
            notes:
                parsed.data.notes === null
                    ? undefined
                    : parsed.data.notes ?? existingAppointment.notes ?? undefined,
        },
        clinicId
    );

    if (!result.success) {
        const status =
            result.error.includes("ocupado") ? 409 : result.error.includes("não encontrado") ? 404 : 422;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(buildSuccessPayload(result.appointment));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
        return authResult;
    }

    const { appointmentId } = await context.params;
    const clinicId = authResult.integration.clinicId;
    const appointment = await appointmentBelongsToClinic(appointmentId, clinicId);

    if (!appointment) {
        return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const result = await updateAppointmentStatus(appointmentId, "cancelled", clinicId);
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({
        id: appointmentId,
        status: "cancelled",
    });
}
