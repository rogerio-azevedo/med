import { and, asc, desc, eq } from "drizzle-orm";
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
