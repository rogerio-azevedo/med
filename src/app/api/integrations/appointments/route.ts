import { NextRequest, NextResponse } from "next/server";
import { createAppointment } from "@/services/appointments";
import {
    authenticateAppointmentIntegrationToken,
    doctorBelongsToClinic,
    findDoctorByClinicAndCrm,
    findPatientByClinicAndCpf,
    findPatientByClinicAndId,
    specialtyExists,
} from "@/services/appointment-integrations";
import { createIntegrationAppointmentSchema } from "@/validations/integration-appointments";

function validationErrorResponse(
    error: Extract<
        ReturnType<typeof createIntegrationAppointmentSchema.safeParse>,
        { success: false }
    >
) {
    return NextResponse.json(
        {
            error: "Payload inválido.",
            details: error.error.flatten(),
        },
        { status: 422 }
    );
}

export async function POST(request: NextRequest) {
    const authResult = await authenticateAppointmentIntegrationToken(
        request.headers.get("authorization")
    );

    if (!authResult.ok) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "JSON inválido." }, { status: 422 });
    }

    const parsed = createIntegrationAppointmentSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed);
    }
    const data = parsed.data;

    const clinicId = authResult.integration.clinicId;
    const doctor = data.doctorId
        ? (await doctorBelongsToClinic(data.doctorId, clinicId))
            ? { id: data.doctorId }
            : null
        : await findDoctorByClinicAndCrm(data.doctorCrm!, data.doctorCrmState!, clinicId);

    if (!doctor) {
        return NextResponse.json(
            { error: "Médico não encontrado para esta clínica." },
            { status: 404 }
        );
    }

    const patient = data.patientId
        ? await findPatientByClinicAndId(data.patientId, clinicId)
        : await findPatientByClinicAndCpf(data.patientCpf!, clinicId);

    if (!patient) {
        return NextResponse.json(
            { error: "Paciente não encontrado para esta clínica." },
            { status: 404 }
        );
    }

    if (data.specialtyId && !(await specialtyExists(data.specialtyId))) {
        return NextResponse.json(
            { error: "Especialidade não encontrada." },
            { status: 404 }
        );
    }

    const result = await createAppointment(
        {
            doctorId: doctor.id,
            patientId: patient.id,
            specialtyId: data.specialtyId,
            scheduledAt: data.scheduledAt,
            durationMinutes: data.durationMinutes,
            modality: data.modality,
            notes: data.notes,
        },
        clinicId
    );

    if (!result.success) {
        const status = result.error.includes("ocupado") ? 409 : 422;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
        {
            id: result.id,
            status: "scheduled",
            scheduledAt: data.scheduledAt,
            durationMinutes: data.durationMinutes,
            doctorId: doctor.id,
            patientId: patient.id,
            externalRequestId: data.externalRequestId ?? null,
        },
        { status: 201 }
    );
}
