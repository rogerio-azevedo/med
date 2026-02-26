import { db } from "@/db";
import { patients, clinicPatients } from "@/db/schema/medical";
import { eq, and } from "drizzle-orm";

export type PatientEligibilityResult =
    | { status: "new" }
    | { status: "active"; patientId: string }
    | { status: "inactive"; patientId: string; patient: any }
    | { status: "global"; patientId: string; patient: any };

export async function checkPatientEligibility(cpf: string, clinicId: string): Promise<PatientEligibilityResult> {
    const cleanedCpf = cpf.replace(/\D/g, "");

    // Find the patient globally first
    const globalPatients = await db
        .select()
        .from(patients)
        .where(eq(patients.cpf, cleanedCpf))
        .limit(1);

    if (globalPatients.length === 0) {
        return { status: "new" };
    }

    const patient = globalPatients[0];

    // Check association with this clinic
    const associations = await db
        .select()
        .from(clinicPatients)
        .where(
            and(
                eq(clinicPatients.patientId, patient.id),
                eq(clinicPatients.clinicId, clinicId)
            )
        )
        .limit(1);

    if (associations.length === 0) {
        return { status: "global", patientId: patient.id, patient };
    }

    const association = associations[0];
    if (association.isActive) {
        return { status: "active", patientId: patient.id };
    } else {
        return { status: "inactive", patientId: patient.id, patient };
    }
}
