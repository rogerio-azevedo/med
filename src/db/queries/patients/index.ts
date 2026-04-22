import { db } from "@/db";
import {
    patients,
    clinicPatients,
    clinicDoctors,
    patientDoctors,
    patientOrigins,
    patientReferrals,
    doctors,
} from "@/db/schema";
import { addresses } from "@/db/schema/clinics";
import { users } from "@/db/schema/auth";
import { getPatientHealthInsurances } from "@/db/queries/health-insurances";
import { eq, and, asc } from "drizzle-orm";

type PatientListItem = {
    id: string;
    name: string;
    cpf: string | null;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
    sex: "M" | "F" | "other" | null;
    createdAt: Date;
    originType: "instagram" | "google" | "facebook" | "friends_family" | "medical_referral" | null;
    referralDoctorName: string | null;
};

export async function getPatientsByClinic(clinicId: string): Promise<PatientListItem[]> {
    return db
        .select({
            id: patients.id,
            name: patients.name,
            cpf: patients.cpf,
            email: patients.email,
            phone: patients.phone,
            birthDate: patients.birthDate,
            sex: patients.sex,
            createdAt: patients.createdAt,
            originType: patientOrigins.originType,
            referralDoctorName: users.name,
        })
        .from(patients)
        .innerJoin(clinicPatients, eq(patients.id, clinicPatients.patientId))
        .leftJoin(
            patientOrigins,
            and(
                eq(patientOrigins.patientId, patients.id),
                eq(patientOrigins.clinicId, clinicId)
            )
        )
        .leftJoin(
            patientReferrals,
            and(
                eq(patientReferrals.patientId, patients.id),
                eq(patientReferrals.clinicId, clinicId),
                eq(patientReferrals.status, "active")
            )
        )
        .leftJoin(doctors, eq(patientReferrals.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(eq(clinicPatients.clinicId, clinicId))
        .orderBy(asc(patients.name));
}

export async function deletePatient(patientId: string, clinicId: string) {
    await db
        .update(clinicPatients)
        .set({ isActive: false })
        .where(
            and(
                eq(clinicPatients.patientId, patientId),
                eq(clinicPatients.clinicId, clinicId)
            )
        );
}

export async function getPatientById(patientId: string, clinicId: string) {
    const patientData = await db
        .select({
            patient: patients,
            clinicAssociation: clinicPatients,
        })
        .from(patients)
        .innerJoin(clinicPatients, eq(patients.id, clinicPatients.patientId))
        .where(
            and(
                eq(patients.id, patientId),
                eq(clinicPatients.clinicId, clinicId)
            )
        )
        .limit(1);

    if (patientData.length === 0) return null;

    const [address, responsibleDoctors, origin, referral, healthInsurances] = await Promise.all([
        db
            .select()
            .from(addresses)
            .where(
                and(
                    eq(addresses.entityId, patientId),
                    eq(addresses.entityType, "patient"),
                    eq(addresses.isPrimary, true)
                )
            )
            .limit(1),
        db
            .select({
                id: doctors.id,
                name: users.name,
            })
            .from(patientDoctors)
            .innerJoin(doctors, eq(patientDoctors.doctorId, doctors.id))
            .innerJoin(
                clinicDoctors,
                and(
                    eq(clinicDoctors.doctorId, doctors.id),
                    eq(clinicDoctors.clinicId, clinicId),
                    eq(clinicDoctors.isActive, true)
                )
            )
            .innerJoin(users, eq(doctors.userId, users.id))
            .where(eq(patientDoctors.patientId, patientId)),
        db
            .select({
                originType: patientOrigins.originType,
            })
            .from(patientOrigins)
            .where(
                and(
                    eq(patientOrigins.patientId, patientId),
                    eq(patientOrigins.clinicId, clinicId)
                )
            )
            .limit(1),
        db
            .select({
                id: patientReferrals.id,
                doctorId: patientReferrals.doctorId,
                source: patientReferrals.source,
                status: patientReferrals.status,
                notes: patientReferrals.notes,
                createdAt: patientReferrals.createdAt,
                confirmedAt: patientReferrals.confirmedAt,
                doctorName: users.name,
            })
            .from(patientReferrals)
            .innerJoin(doctors, eq(patientReferrals.doctorId, doctors.id))
            .innerJoin(users, eq(doctors.userId, users.id))
            .where(
                and(
                    eq(patientReferrals.patientId, patientId),
                    eq(patientReferrals.clinicId, clinicId),
                    eq(patientReferrals.status, "active")
                )
            )
            .limit(1),
        getPatientHealthInsurances(patientId),
    ]);

    return {
        ...patientData[0].patient,
        responsibleDoctors,
        patientHealthInsurances: healthInsurances,
        address: address[0] || null,
        originType: origin[0]?.originType ?? null,
        referral: referral[0]
            ? {
                id: referral[0].id,
                doctorId: referral[0].doctorId,
                doctorName: referral[0].doctorName,
                source: referral[0].source,
                status: referral[0].status,
                notes: referral[0].notes,
                createdAt: referral[0].createdAt,
                confirmedAt: referral[0].confirmedAt,
            }
            : null,
    };
}
