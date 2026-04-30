import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
    checkIns,
    clinicDoctors,
    clinicHealthInsurances,
    clinicPatients,
    clinicUsers,
    doctors,
    healthInsurances,
    patients,
    serviceTypes,
    users,
} from "@/db/schema";

const doctorUser = alias(users, "check_in_doctor_user");
const receptionUser = alias(users, "check_in_reception_user");

export async function getCheckIns(clinicId: string) {
    return db
        .select({
            id: checkIns.id,
            createdAt: checkIns.createdAt,
            patient: {
                id: patients.id,
                name: patients.name,
            },
            serviceType: {
                id: serviceTypes.id,
                name: serviceTypes.name,
            },
            healthInsurance: {
                id: healthInsurances.id,
                name: healthInsurances.name,
            },
            doctor: {
                id: doctors.id,
                name: doctorUser.name,
            },
            createdBy: {
                clinicUserId: clinicUsers.id,
                userId: receptionUser.id,
                name: receptionUser.name,
            },
            notes: checkIns.notes,
        })
        .from(checkIns)
        .innerJoin(patients, eq(checkIns.patientId, patients.id))
        .innerJoin(serviceTypes, eq(checkIns.serviceTypeId, serviceTypes.id))
        .leftJoin(doctors, eq(checkIns.doctorId, doctors.id))
        .leftJoin(doctorUser, eq(doctors.userId, doctorUser.id))
        .innerJoin(clinicUsers, eq(checkIns.createdByClinicUserId, clinicUsers.id))
        .innerJoin(receptionUser, eq(clinicUsers.userId, receptionUser.id))
        .leftJoin(healthInsurances, eq(checkIns.healthInsuranceId, healthInsurances.id))
        .where(eq(checkIns.clinicId, clinicId))
        .orderBy(desc(checkIns.createdAt), asc(patients.name));
}

/**
 * Retorna um Set com os IDs dos agendamentos que já possuem um check-in
 * correspondente (mesmo paciente + médico + dia).
 * Usada na agenda para exibir o ícone verde quando o check-in já foi feito.
 */
export async function getCheckInExistenceForAppointments(
    clinicId: string,
    appointments: {
        id: string;
        patientId: string;
        doctorId: string | null;
        scheduledAt: Date | string;
    }[]
): Promise<Set<string>> {
    if (appointments.length === 0) return new Set();

    const dates = appointments.map((a) => new Date(a.scheduledAt));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    const existing = await db
        .select({
            patientId: checkIns.patientId,
            doctorId: checkIns.doctorId,
            createdAt: checkIns.createdAt,
        })
        .from(checkIns)
        .where(
            and(
                eq(checkIns.clinicId, clinicId),
                gte(checkIns.createdAt, minDate),
                lte(checkIns.createdAt, maxDate)
            )
        );

    // Chave de lookup: patientId|doctorId|YYYY-M-D (dia local UTC)
    const checkedKeys = new Set(
        existing.map((ci) => {
            const d = new Date(ci.createdAt);
            return `${ci.patientId}|${ci.doctorId ?? ""}|${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        })
    );

    const result = new Set<string>();
    for (const appt of appointments) {
        const d = new Date(appt.scheduledAt);
        const key = `${appt.patientId}|${appt.doctorId ?? ""}|${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        if (checkedKeys.has(key)) {
            result.add(appt.id);
        }
    }

    return result;
}

export async function createCheckInQuery(data: typeof checkIns.$inferInsert) {
    const [created] = await db.insert(checkIns).values(data).returning({ id: checkIns.id });
    return created;
}

export async function getCheckInDependencies(
    clinicId: string,
    payload: {
        patientId: string;
        serviceTypeId: string;
        doctorId: string;
        healthInsuranceId?: string | null;
        createdByClinicUserId: string;
    }
) {
    const [patientLink, serviceType, clinicDoctor, clinicUser, clinicInsurance] = await Promise.all([
        db.query.clinicPatients.findFirst({
            where: and(
                eq(clinicPatients.clinicId, clinicId),
                eq(clinicPatients.patientId, payload.patientId),
                eq(clinicPatients.isActive, true)
            ),
        }),
        db.query.serviceTypes.findFirst({
            where: and(
                eq(serviceTypes.clinicId, clinicId),
                eq(serviceTypes.id, payload.serviceTypeId),
                eq(serviceTypes.isActive, true)
            ),
        }),
        db.query.clinicDoctors.findFirst({
            where: and(
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.doctorId, payload.doctorId),
                eq(clinicDoctors.isActive, true),
                eq(clinicDoctors.relationshipType, "linked")
            ),
        }),
        db.query.clinicUsers.findFirst({
            where: and(
                eq(clinicUsers.clinicId, clinicId),
                eq(clinicUsers.id, payload.createdByClinicUserId),
                eq(clinicUsers.isActive, true)
            ),
        }),
        payload.healthInsuranceId
            ? db.query.clinicHealthInsurances.findFirst({
                  where: and(
                      eq(clinicHealthInsurances.clinicId, clinicId),
                      eq(clinicHealthInsurances.healthInsuranceId, payload.healthInsuranceId),
                      eq(clinicHealthInsurances.isActive, true)
                  ),
              })
            : Promise.resolve(null),
    ]);

    return {
        patientLink,
        serviceType,
        clinicDoctor,
        clinicUser,
        clinicInsurance,
    };
}
