import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
    checkIns,
    clinicHealthInsurances,
    clinicPatients,
    clinicUsers,
    healthInsurances,
    patients,
    scoreItems,
    serviceTypes,
    users,
} from "@/db/schema";

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
            scoreItem: {
                id: scoreItems.id,
                name: scoreItems.name,
                score: scoreItems.score,
            },
            createdBy: {
                clinicUserId: clinicUsers.id,
                userId: users.id,
                name: users.name,
            },
            notes: checkIns.notes,
        })
        .from(checkIns)
        .innerJoin(patients, eq(checkIns.patientId, patients.id))
        .innerJoin(serviceTypes, eq(checkIns.serviceTypeId, serviceTypes.id))
        .innerJoin(scoreItems, eq(checkIns.scoreItemId, scoreItems.id))
        .innerJoin(clinicUsers, eq(checkIns.createdByClinicUserId, clinicUsers.id))
        .innerJoin(users, eq(clinicUsers.userId, users.id))
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
        scoreItemId: string;
        healthInsuranceId?: string | null;
        createdByClinicUserId: string;
    }
) {
    const [patientLink, serviceType, scoreItem, clinicUser, clinicInsurance] = await Promise.all([
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
        db.query.scoreItems.findFirst({
            where: and(
                eq(scoreItems.clinicId, clinicId),
                eq(scoreItems.id, payload.scoreItemId),
                eq(scoreItems.isActive, true)
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
        scoreItem,
        clinicUser,
        clinicInsurance,
    };
}
