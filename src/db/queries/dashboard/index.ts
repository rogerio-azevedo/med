import { db } from "@/db";
import {
    appointments,
    clinicDoctors,
    clinicPatients,
    doctors,
    patients,
    serviceRecords,
    doctorSpecialties,
    specialties,
    patientDoctors,
} from "@/db/schema";
import { and, count, eq, gte, lt, lte, sql } from "drizzle-orm";
import { users } from "@/db/schema/auth";

// Helpers
function todayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
}

function thisMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

// ─── Admin Dashboard ──────────────────────────────────────────────────

export async function getAdminDashboardStats(clinicId: string) {
    const { start: monthStart, end: monthEnd } = thisMonthRange();
    const { start: todayStart, end: todayEnd } = todayRange();

    const [totalDoctorsResult] = await db
        .select({ count: count() })
        .from(clinicDoctors)
        .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.isActive, true)));

    const [totalPatientsResult] = await db
        .select({ count: count() })
        .from(clinicPatients)
        .where(and(eq(clinicPatients.clinicId, clinicId), eq(clinicPatients.isActive, true)));

    const [totalAppointmentsResult] = await db
        .select({ count: count() })
        .from(appointments)
        .where(eq(appointments.clinicId, clinicId));

    const [todayAppointmentsResult] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
            and(
                eq(appointments.clinicId, clinicId),
                gte(appointments.scheduledAt, todayStart),
                lte(appointments.scheduledAt, todayEnd),
            )
        );

    const [monthServiceRecordsResult] = await db
        .select({ count: count() })
        .from(serviceRecords)
        .where(
            and(
                eq(serviceRecords.clinicId, clinicId),
                gte(serviceRecords.occurredAt, monthStart),
                lte(serviceRecords.occurredAt, monthEnd),
            )
        );

    return {
        totalDoctors: totalDoctorsResult?.count ?? 0,
        totalPatients: totalPatientsResult?.count ?? 0,
        totalAppointments: totalAppointmentsResult?.count ?? 0,
        todayAppointments: todayAppointmentsResult?.count ?? 0,
        monthServiceRecords: monthServiceRecordsResult?.count ?? 0,
    };
}

export async function getTodayAppointments(clinicId: string) {
    const { start, end } = todayRange();

    return db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            durationMinutes: appointments.durationMinutes,
            modality: appointments.modality,
            status: appointments.status,
            notes: appointments.notes,
            patientName: patients.name,
            doctorName: users.name,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(
            and(
                eq(appointments.clinicId, clinicId),
                gte(appointments.scheduledAt, start),
                lte(appointments.scheduledAt, end),
            )
        )
        .orderBy(appointments.scheduledAt);
}

// ─── Doctor Dashboard ─────────────────────────────────────────────────

export async function getDoctorByUserId(userId: string) {
    return db.query.doctors.findFirst({
        where: eq(doctors.userId, userId),
    });
}

export async function getDoctorDashboardStats(clinicId: string, doctorId: string) {
    const { start: todayStart, end: todayEnd } = todayRange();
    const { start: monthStart, end: monthEnd } = thisMonthRange();

    const [totalPatientsResult] = await db
        .select({ count: count() })
        .from(clinicPatients)
        .innerJoin(patientDoctors, eq(clinicPatients.patientId, patientDoctors.patientId))
        .where(
            and(
                eq(clinicPatients.clinicId, clinicId),
                eq(patientDoctors.doctorId, doctorId),
                eq(clinicPatients.isActive, true),
            )
        );

    const [todayAppointmentsResult] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
            and(
                eq(appointments.clinicId, clinicId),
                eq(appointments.doctorId, doctorId),
                gte(appointments.scheduledAt, todayStart),
                lte(appointments.scheduledAt, todayEnd),
            )
        );

    const [monthServiceRecordsResult] = await db
        .select({ count: count() })
        .from(serviceRecords)
        .where(
            and(
                eq(serviceRecords.clinicId, clinicId),
                eq(serviceRecords.doctorId, doctorId),
                gte(serviceRecords.occurredAt, monthStart),
                lte(serviceRecords.occurredAt, monthEnd),
            )
        );

    return {
        totalPatients: totalPatientsResult?.count ?? 0,
        todayAppointments: todayAppointmentsResult?.count ?? 0,
        monthServiceRecords: monthServiceRecordsResult?.count ?? 0,
    };
}

export async function getDoctorTodayAppointments(clinicId: string, doctorId: string) {
    const { start, end } = todayRange();

    return db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            durationMinutes: appointments.durationMinutes,
            modality: appointments.modality,
            status: appointments.status,
            notes: appointments.notes,
            patientName: patients.name,
            doctorName: sql<string>`null`.as("doctorName"),
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
            and(
                eq(appointments.clinicId, clinicId),
                eq(appointments.doctorId, doctorId),
                gte(appointments.scheduledAt, start),
                lte(appointments.scheduledAt, end),
            )
        )
        .orderBy(appointments.scheduledAt);
}

// ─── Patient Dashboard ────────────────────────────────────────────────

export async function getPatientByUserId(userId: string) {
    return db.query.patients.findFirst({
        where: eq(patients.userId, userId),
    });
}

export async function getPatientDashboardStats(clinicId: string, patientId: string) {
    const now = new Date();

    const [totalServiceRecordsResult] = await db
        .select({ count: count() })
        .from(serviceRecords)
        .where(
            and(
                eq(serviceRecords.clinicId, clinicId),
                eq(serviceRecords.patientId, patientId),
            )
        );

    const nextAppointment = await db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            modality: appointments.modality,
            status: appointments.status,
            doctorName: users.name,
        })
        .from(appointments)
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(
            and(
                eq(appointments.clinicId, clinicId),
                eq(appointments.patientId, patientId),
                gte(appointments.scheduledAt, now),
                sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
            )
        )
        .orderBy(appointments.scheduledAt)
        .limit(1);

    return {
        totalServiceRecords: totalServiceRecordsResult?.count ?? 0,
        nextAppointment: nextAppointment[0] ?? null,
    };
}

export async function getPatientDoctors(clinicId: string, patientId: string) {
    const rows = await db
        .select({
            doctorId: doctors.id,
            doctorName: users.name,
            image: users.image,
            specialtyName: specialties.name,
        })
        .from(clinicPatients)
        .innerJoin(patientDoctors, eq(clinicPatients.patientId, patientDoctors.patientId))
        .innerJoin(doctors, eq(patientDoctors.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .where(
            and(
                eq(clinicPatients.clinicId, clinicId),
                eq(clinicPatients.patientId, patientId),
                eq(clinicPatients.isActive, true),
            )
        );

    // Group specialties by doctor
    const doctorMap = new Map<string, { doctorId: string; doctorName: string | null; image: string | null; specialties: string[] }>();
    for (const row of rows) {
        if (!doctorMap.has(row.doctorId)) {
            doctorMap.set(row.doctorId, {
                doctorId: row.doctorId,
                doctorName: row.doctorName,
                image: row.image,
                specialties: [],
            });
        }
        if (row.specialtyName) {
            doctorMap.get(row.doctorId)!.specialties.push(row.specialtyName);
        }
    }

    return Array.from(doctorMap.values());
}

export async function getPatientAppointments(clinicId: string, patientId: string) {
    return db
        .select({
            id: appointments.id,
            scheduledAt: appointments.scheduledAt,
            durationMinutes: appointments.durationMinutes,
            modality: appointments.modality,
            status: appointments.status,
            doctorName: users.name,
        })
        .from(appointments)
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(
            and(
                eq(appointments.clinicId, clinicId),
                eq(appointments.patientId, patientId),
            )
        )
        .orderBy(sql`${appointments.scheduledAt} DESC`)
        .limit(10);
}
