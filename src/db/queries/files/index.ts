import { db } from "@/db";
import { patientFiles, consultations, clinicPatients } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

export async function patientBelongsToClinic(patientId: string, clinicId: string): Promise<boolean> {
    const row = await db.query.clinicPatients.findFirst({
        where: and(
            eq(clinicPatients.patientId, patientId),
            eq(clinicPatients.clinicId, clinicId),
            eq(clinicPatients.isActive, true)
        ),
    });
    return !!row;
}

export async function getConsultationForPatientInClinic(
    consultationId: string,
    clinicId: string,
    patientId: string
) {
    return db.query.consultations.findFirst({
        where: and(
            eq(consultations.id, consultationId),
            eq(consultations.clinicId, clinicId),
            eq(consultations.patientId, patientId)
        ),
    });
}

export type PatientFileInsert = InferInsertModel<typeof patientFiles>;

export async function insertPatientFile(data: PatientFileInsert) {
    const [row] = await db.insert(patientFiles).values(data).returning();
    return row;
}

export async function getPatientFileById(fileId: string, clinicId: string) {
    return db.query.patientFiles.findFirst({
        where: and(eq(patientFiles.id, fileId), eq(patientFiles.clinicId, clinicId)),
        with: {
            uploader: { columns: { name: true, id: true } },
        },
    });
}

export async function listPatientFilesByPatient(patientId: string, clinicId: string) {
    return db.query.patientFiles.findMany({
        where: and(eq(patientFiles.patientId, patientId), eq(patientFiles.clinicId, clinicId)),
        orderBy: (f, { desc }) => [desc(f.createdAt)],
        with: {
            uploader: { columns: { name: true } },
        },
    });
}

export async function listPatientFilesByConsultation(consultationId: string, clinicId: string) {
    return db.query.patientFiles.findMany({
        where: and(
            eq(patientFiles.consultationId, consultationId),
            eq(patientFiles.clinicId, clinicId)
        ),
        orderBy: (f, { desc }) => [desc(f.createdAt)],
        with: {
            uploader: { columns: { name: true } },
        },
    });
}

export async function deletePatientFileRecord(fileId: string, clinicId: string) {
    const [del] = await db
        .delete(patientFiles)
        .where(and(eq(patientFiles.id, fileId), eq(patientFiles.clinicId, clinicId)))
        .returning();
    return del ?? null;
}
