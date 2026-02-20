import { db } from "@/db";
import { patients, clinicPatients, patientDoctors, doctors } from "@/db/schema/medical";
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
    // First, remove the association with the clinic
    await db
        .delete(clinicPatients)
        .where(
            and(
                eq(clinicPatients.patientId, patientId),
                eq(clinicPatients.clinicId, clinicId)
            )
        );

    // Then check if the patient is associated with any other clinic
    const otherClinics = await db
        .select()
        .from(clinicPatients)
        .where(eq(clinicPatients.patientId, patientId));

    // If not, we can delete the global patient record (optional, depending on business rules)
    // For now, let's just keep the association deletion as the primary action for a clinic user
    if (otherClinics.length === 0) {
        await db.delete(patients).where(eq(patients.id, patientId));
    }
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

    return {
        ...patientData[0].patient,
        responsibleDoctors,
        address: address[0] || null,
    };
}
