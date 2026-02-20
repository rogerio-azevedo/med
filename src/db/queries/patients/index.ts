import { db } from "@/db";
import { patients, clinicPatients } from "@/db/schema/medical";
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
