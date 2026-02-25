import { and, eq, not, inArray, gte, lte, lt, gt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema/medical";
import { doctors } from "@/db/schema/medical";
import { patients } from "@/db/schema/medical";
import { specialties } from "@/db/schema/medical";
import { users } from "@/db/schema/auth";

export async function getAppointmentsByClinic(
    clinicId: string,
    filters?: {
        doctorId?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string[];
    }
) {
    const conditions = [eq(appointments.clinicId, clinicId)];

    if (filters?.doctorId) {
        conditions.push(eq(appointments.doctorId, filters.doctorId));
    }
    if (filters?.startDate) {
        conditions.push(gte(appointments.scheduledAt, filters.startDate));
    }
    if (filters?.endDate) {
        conditions.push(lte(appointments.scheduledAt, filters.endDate));
    }
    if (filters?.status && filters.status.length > 0) {
        conditions.push(
            inArray(
                appointments.status,
                filters.status as (
                    | "scheduled"
                    | "confirmed"
                    | "in_progress"
                    | "done"
                    | "cancelled"
                    | "no_show"
                )[]
            )
        );
    }

    return db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            durationMinutes: appointments.durationMinutes,
            modality: appointments.modality,
            status: appointments.status,
            notes: appointments.notes,
            createdAt: appointments.createdAt,
            doctor: {
                id: doctors.id,
                name: users.name,
            },
            patient: {
                id: patients.id,
                name: patients.name,
                phone: patients.phone,
            },
            specialty: {
                id: specialties.id,
                name: specialties.name,
            },
        })
        .from(appointments)
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .leftJoin(specialties, eq(appointments.specialtyId, specialties.id))
        .where(and(...conditions))
        .orderBy(appointments.scheduledAt);
}

export async function getAppointmentsByDoctor(
    doctorId: string,
    clinicId: string,
    startDate: Date,
    endDate: Date
) {
    return db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            durationMinutes: appointments.durationMinutes,
            modality: appointments.modality,
            status: appointments.status,
            notes: appointments.notes,
            patient: {
                id: patients.id,
                name: patients.name,
                phone: patients.phone,
            },
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
            and(
                eq(appointments.doctorId, doctorId),
                eq(appointments.clinicId, clinicId),
                gte(appointments.scheduledAt, startDate),
                lte(appointments.scheduledAt, endDate)
            )
        )
        .orderBy(appointments.scheduledAt);
}

export async function getAppointmentById(id: string, clinicId: string) {
    const results = await db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            durationMinutes: appointments.durationMinutes,
            modality: appointments.modality,
            status: appointments.status,
            notes: appointments.notes,
            createdAt: appointments.createdAt,
            doctorId: appointments.doctorId,
            patientId: appointments.patientId,
            specialtyId: appointments.specialtyId,
            patientPackageId: appointments.patientPackageId,
            doctor: {
                id: doctors.id,
                name: users.name,
            },
            patient: {
                id: patients.id,
                name: patients.name,
                phone: patients.phone,
                email: patients.email,
            },
            specialty: {
                id: specialties.id,
                name: specialties.name,
            },
        })
        .from(appointments)
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .leftJoin(specialties, eq(appointments.specialtyId, specialties.id))
        .where(and(eq(appointments.id, id), eq(appointments.clinicId, clinicId)))
        .limit(1);

    return results[0] ?? null;
}

export async function createAppointment(data: {
    clinicId: string;
    doctorId: string;
    patientId: string;
    specialtyId?: string;
    patientPackageId?: string;
    scheduledAt: Date;
    durationMinutes: number;
    modality: "in_person" | "remote" | "phone" | "whatsapp";
    notes?: string;
}) {
    const result = await db
        .insert(appointments)
        .values(data)
        .returning({ id: appointments.id });
    return result[0];
}

export async function updateAppointmentStatus(
    id: string,
    status: "scheduled" | "confirmed" | "in_progress" | "done" | "cancelled" | "no_show",
    clinicId: string
) {
    return db
        .update(appointments)
        .set({ status })
        .where(and(eq(appointments.id, id), eq(appointments.clinicId, clinicId)));
}

/**
 * Verifica se há conflito de horário para um médico.
 * Conflito existe quando os intervalos se sobrepõem:
 *   existingStart < novoFim AND existingEnd > novoInicio
 */
export async function checkConflict(
    doctorId: string,
    clinicId: string,
    startsAt: Date,
    durationMinutes: number,
    excludeId?: string
): Promise<boolean> {
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

    const conditions = [
        eq(appointments.doctorId, doctorId),
        eq(appointments.clinicId, clinicId),
        not(
            inArray(appointments.status, ["cancelled", "no_show"])
        ),
        // existingStart < novoFim
        lt(appointments.scheduledAt, sql`${endsAt.toISOString().slice(0, 19).replace("T", " ")}::timestamp`),
        // existingEnd > novoInicio  (existingEnd = scheduledAt + durationMinutes)
        gt(
            sql`${appointments.scheduledAt} + (${appointments.durationMinutes} || ' minutes')::interval`,
            sql`${startsAt.toISOString().slice(0, 19).replace("T", " ")}::timestamp`
        ),
    ];

    if (excludeId) {
        conditions.push(ne(appointments.id, excludeId));
    }

    const result = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(and(...conditions))
        .limit(1);

    return result.length > 0;
}
