import { db } from "@/db";
import { patients, clinicPatients, patientDoctors, patientOrigins, doctors } from "@/db/schema/medical";
import { addresses } from "@/db/schema/clinics";
import { users } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";

export async function getPatientsByClinic(clinicId: string) {
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
        })
        .from(patients)
        .innerJoin(clinicPatients, eq(patients.id, clinicPatients.patientId))
        .where(eq(clinicPatients.clinicId, clinicId));
}

export async function deletePatient(patientId: string, clinicId: string) {
    // Soft delete: set isActive to false for the clinic association
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

    const address = await db
        .select()
        .from(addresses)
        .where(
            and(
                eq(addresses.entityId, patientId),
                eq(addresses.entityType, "patient"),
                eq(addresses.isPrimary, true)
            )
        )
        .limit(1);

    const responsibleDoctors = await db
        .select({
            id: doctors.id,
            name: users.name,
        })
        .from(patientDoctors)
        .innerJoin(doctors, eq(patientDoctors.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(eq(patientDoctors.patientId, patientId));

    const origin = await db
        .select({
            originType: patientOrigins.originType,
            referringDoctorId: patientOrigins.referringDoctorId,
        })
        .from(patientOrigins)
        .where(
            and(
                eq(patientOrigins.patientId, patientId),
                eq(patientOrigins.clinicId, clinicId)
            )
        )
        .limit(1);

    return {
        ...patientData[0].patient,
        responsibleDoctors,
        address: address[0] || null,
        originType: origin[0]?.originType ?? null,
        referringDoctorId: origin[0]?.referringDoctorId ?? null,
    };
}
