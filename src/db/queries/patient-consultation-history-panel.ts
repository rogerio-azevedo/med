import { db } from "@/db";
import type { SQL } from "drizzle-orm";
import {
    consultations,
    consultationSoap,
    icd10Codes,
    doctors,
    users,
    serviceTypes,
} from "@/db/schema";
import { eq, and, desc, or, isNull, ne } from "drizzle-orm";

/** Histórico compacto para painel lateral no modal de consulta (consultas finalizadas). */
export type PatientConsultationHistoryPanelRow = {
    id: string;
    startTime: Date;
    serviceTypeName: string | null;
    doctorName: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    diagnosisFreeText: string | null;
    cidCode: string | null;
};

export async function getPatientConsultationsSummaryForPanel(
    patientId: string,
    clinicId: string,
    options?: { excludeConsultationId?: string | null; limit?: number }
): Promise<PatientConsultationHistoryPanelRow[]> {
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
    const notSurgeryWorkflow = or(
        isNull(serviceTypes.workflow),
        ne(serviceTypes.workflow, "surgery")
    ) as SQL;

    const whereConditions: SQL[] = [
        eq(consultations.patientId, patientId),
        eq(consultations.clinicId, clinicId),
        eq(consultations.status, "finished"),
        notSurgeryWorkflow,
    ];

    if (options?.excludeConsultationId) {
        whereConditions.push(ne(consultations.id, options.excludeConsultationId));
    }

    return db
        .select({
            id: consultations.id,
            startTime: consultations.startTime,
            serviceTypeName: serviceTypes.name,
            doctorName: users.name,
            subjective: consultationSoap.subjective,
            objective: consultationSoap.objective,
            assessment: consultationSoap.assessment,
            plan: consultationSoap.plan,
            diagnosisFreeText: consultationSoap.diagnosisFreeText,
            cidCode: icd10Codes.code,
        })
        .from(consultations)
        .leftJoin(consultationSoap, eq(consultations.id, consultationSoap.consultationId))
        .leftJoin(icd10Codes, eq(consultationSoap.diagnosisCidId, icd10Codes.id))
        .leftJoin(serviceTypes, eq(consultations.serviceTypeId, serviceTypes.id))
        .leftJoin(doctors, eq(consultations.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(consultations.startTime))
        .limit(limit);
}
