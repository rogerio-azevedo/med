import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
    appointmentIntegrationCredentials,
    appointments,
    clinicDoctors,
    clinicPatients,
    doctors,
    patients,
    specialties,
} from "@/db/schema";
import type { CreateAppointmentIntegrationCredentialInput } from "@/validations/integration-appointments";

export const APPOINTMENT_INTEGRATION_SCOPE = "appointments:write";
const APPOINTMENT_INTEGRATION_TYPE = "integration";

type AppointmentIntegrationJwtPayload = {
    sub: string;
    clinicId: string;
    scope: string;
    jti: string;
    type: string;
};

function getIntegrationJwtSecret() {
    const secret =
        process.env.APPOINTMENT_INTEGRATION_JWT_SECRET ?? process.env.NEXTAUTH_SECRET;

    if (!secret) {
        throw new Error(
            "Configure APPOINTMENT_INTEGRATION_JWT_SECRET ou NEXTAUTH_SECRET para usar integracoes."
        );
    }

    return secret;
}

function encodeBase64Url(value: string) {
    return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
    return Buffer.from(value, "base64url").toString("utf8");
}

function signHs256(value: string, secret: string) {
    return createHmac("sha256", secret).update(value).digest("base64url");
}

async function signAppointmentIntegrationToken(payload: AppointmentIntegrationJwtPayload) {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(
        JSON.stringify({
            sub: payload.sub,
            clinicId: payload.clinicId,
            scope: payload.scope,
            jti: payload.jti,
            type: payload.type,
            iat: Math.floor(Date.now() / 1000),
        })
    );
    const signature = signHs256(`${header}.${body}`, getIntegrationJwtSecret());
    return `${header}.${body}.${signature}`;
}

function verifyAppointmentIntegrationToken(token: string) {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        throw new Error("Malformed token");
    }

    const expectedSignature = signHs256(
        `${encodedHeader}.${encodedPayload}`,
        getIntegrationJwtSecret()
    );

    const actualBuffer = Buffer.from(encodedSignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
        actualBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
        throw new Error("Invalid signature");
    }

    const header = JSON.parse(decodeBase64Url(encodedHeader)) as {
        alg?: string;
        typ?: string;
    };
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AppointmentIntegrationJwtPayload;

    if (header.alg !== "HS256" || header.typ !== "JWT") {
        throw new Error("Unsupported token");
    }

    return payload;
}

export async function createAppointmentIntegrationCredential(
    clinicId: string,
    input: CreateAppointmentIntegrationCredentialInput
) {
    const tokenJti = crypto.randomUUID();

    const [credential] = await db
        .insert(appointmentIntegrationCredentials)
        .values({
            clinicId,
            name: input.name.trim(),
            tokenJti,
            scope: APPOINTMENT_INTEGRATION_SCOPE,
        })
        .returning({
            id: appointmentIntegrationCredentials.id,
            clinicId: appointmentIntegrationCredentials.clinicId,
            name: appointmentIntegrationCredentials.name,
            scope: appointmentIntegrationCredentials.scope,
            createdAt: appointmentIntegrationCredentials.createdAt,
        });

    const token = await signAppointmentIntegrationToken({
        sub: credential.id,
        clinicId,
        scope: APPOINTMENT_INTEGRATION_SCOPE,
        jti: tokenJti,
        type: APPOINTMENT_INTEGRATION_TYPE,
    });

    return {
        credential,
        token,
    };
}

export async function listAppointmentIntegrationCredentials(clinicId: string) {
    return db
        .select({
            id: appointmentIntegrationCredentials.id,
            name: appointmentIntegrationCredentials.name,
            scope: appointmentIntegrationCredentials.scope,
            isActive: appointmentIntegrationCredentials.isActive,
            lastUsedAt: appointmentIntegrationCredentials.lastUsedAt,
            revokedAt: appointmentIntegrationCredentials.revokedAt,
            createdAt: appointmentIntegrationCredentials.createdAt,
            updatedAt: appointmentIntegrationCredentials.updatedAt,
        })
        .from(appointmentIntegrationCredentials)
        .where(eq(appointmentIntegrationCredentials.clinicId, clinicId));
}

export async function revokeAppointmentIntegrationCredential(
    clinicId: string,
    credentialId: string
) {
    const [credential] = await db
        .update(appointmentIntegrationCredentials)
        .set({
            isActive: false,
            revokedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appointmentIntegrationCredentials.id, credentialId),
                eq(appointmentIntegrationCredentials.clinicId, clinicId)
            )
        )
        .returning({
            id: appointmentIntegrationCredentials.id,
            name: appointmentIntegrationCredentials.name,
            isActive: appointmentIntegrationCredentials.isActive,
            revokedAt: appointmentIntegrationCredentials.revokedAt,
        });

    return credential ?? null;
}

export async function rotateAppointmentIntegrationCredential(
    clinicId: string,
    credentialId: string
) {
    const tokenJti = crypto.randomUUID();

    const [credential] = await db
        .update(appointmentIntegrationCredentials)
        .set({
            tokenJti,
            isActive: true,
            revokedAt: null,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appointmentIntegrationCredentials.id, credentialId),
                eq(appointmentIntegrationCredentials.clinicId, clinicId)
            )
        )
        .returning({
            id: appointmentIntegrationCredentials.id,
            clinicId: appointmentIntegrationCredentials.clinicId,
            name: appointmentIntegrationCredentials.name,
            scope: appointmentIntegrationCredentials.scope,
        });

    if (!credential) {
        return null;
    }

    const token = await signAppointmentIntegrationToken({
        sub: credential.id,
        clinicId,
        scope: APPOINTMENT_INTEGRATION_SCOPE,
        jti: tokenJti,
        type: APPOINTMENT_INTEGRATION_TYPE,
    });

    return { credential, token };
}

export async function authenticateAppointmentIntegrationToken(
    authHeader: string | null
) {
    if (!authHeader?.startsWith("Bearer ")) {
        return { ok: false as const, status: 401, error: "Bearer token ausente." };
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
        return { ok: false as const, status: 401, error: "Bearer token ausente." };
    }

    let payload: AppointmentIntegrationJwtPayload;

    try {
        payload = verifyAppointmentIntegrationToken(token);
    } catch {
        return { ok: false as const, status: 401, error: "Token invalido." };
    }

    if (payload.type !== APPOINTMENT_INTEGRATION_TYPE) {
        return { ok: false as const, status: 401, error: "Tipo de token invalido." };
    }

    if (payload.scope !== APPOINTMENT_INTEGRATION_SCOPE) {
        return { ok: false as const, status: 403, error: "Escopo insuficiente." };
    }

    if (!payload.sub || !payload.clinicId || !payload.jti) {
        return { ok: false as const, status: 401, error: "Token incompleto." };
    }

    const credential = await db.query.appointmentIntegrationCredentials.findFirst({
        where: and(
            eq(appointmentIntegrationCredentials.id, payload.sub),
            eq(appointmentIntegrationCredentials.clinicId, payload.clinicId),
            eq(appointmentIntegrationCredentials.isActive, true),
            isNull(appointmentIntegrationCredentials.revokedAt)
        ),
    });

    if (!credential || credential.tokenJti !== payload.jti) {
        return { ok: false as const, status: 401, error: "Token revogado ou invalido." };
    }

    await db
        .update(appointmentIntegrationCredentials)
        .set({
            lastUsedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(appointmentIntegrationCredentials.id, credential.id));

    return {
        ok: true as const,
        integration: {
            id: credential.id,
            clinicId: credential.clinicId,
            name: credential.name,
            scope: credential.scope,
        },
    };
}

export async function doctorBelongsToClinic(doctorId: string, clinicId: string) {
    const doctor = await db.query.clinicDoctors.findFirst({
        where: and(
            eq(clinicDoctors.doctorId, doctorId),
            eq(clinicDoctors.clinicId, clinicId),
            eq(clinicDoctors.isActive, true)
        ),
    });

    return !!doctor;
}

export async function findDoctorByClinicAndCrm(
    crm: string,
    crmState: string,
    clinicId: string
) {
    const cleanedCrm = crm.replace(/\D/g, "");

    const [doctor] = await db
        .select({
            id: doctors.id,
        })
        .from(doctors)
        .innerJoin(clinicDoctors, eq(clinicDoctors.doctorId, doctors.id))
        .where(
            and(
                eq(doctors.crm, cleanedCrm),
                eq(doctors.crmState, crmState),
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true)
            )
        )
        .limit(1);

    return doctor ?? null;
}

export async function findPatientByClinicAndId(patientId: string, clinicId: string) {
    const patient = await db.query.clinicPatients.findFirst({
        where: and(
            eq(clinicPatients.patientId, patientId),
            eq(clinicPatients.clinicId, clinicId),
            eq(clinicPatients.isActive, true)
        ),
    });

    return patient ? { id: patient.patientId } : null;
}

export async function findPatientByClinicAndCpf(patientCpf: string, clinicId: string) {
    const [patient] = await db
        .select({
            id: patients.id,
        })
        .from(patients)
        .innerJoin(clinicPatients, eq(clinicPatients.patientId, patients.id))
        .where(
            and(
                eq(patients.cpf, patientCpf),
                eq(clinicPatients.clinicId, clinicId),
                eq(clinicPatients.isActive, true)
            )
        )
        .limit(1);

    return patient ?? null;
}

export async function specialtyExists(specialtyId: string) {
    const specialty = await db.query.specialties.findFirst({
        where: eq(specialties.id, specialtyId),
    });

    return !!specialty;
}

export async function appointmentBelongsToClinic(appointmentId: string, clinicId: string) {
    const appointment = await db.query.appointments.findFirst({
        where: and(
            eq(appointments.id, appointmentId),
            eq(appointments.clinicId, clinicId)
        ),
    });

    return appointment ?? null;
}
