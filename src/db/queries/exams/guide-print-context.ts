import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
    clinics,
    doctors,
    examProcedures,
    exams,
    healthInsurances,
    patientHealthInsurances,
    patients,
    procedures,
    users,
} from "@/db/schema";

export type ExamGuideProcedureRow = {
    tussCode: string | null;
    name: string;
    quantity: number;
};

export type ExamGuidePrintContext = {
    clinicName: string;
    clinicCnpj: string | null;
    patientName: string;
    cardNumber: string | null;
    insuranceName: string | null;
    insuranceAnsCode: string | null;
    insuranceLogoKeyOrUrl: string | null;
    doctorName: string | null;
    crm: string | null;
    crmState: string | null;
    cboCode: string | null;
    careType: "elective" | "urgent_emergency" | null;
    clinicalIndication: string | null;
    scheduledAt: Date | null;
    /** Data/hora exibida na guia: `scheduledAt` ou, se vazio, `startTime` do exame. */
    guideDateTime: Date | null;
    procedures: ExamGuideProcedureRow[];
};

/**
 * Dados para impressão da Guia SADT. Retorna `null` se o exame não existir
 * ou não for externo (`location !== "external"`).
 */
export async function getExamGuidePrintContext(
    examId: string,
    clinicId: string
): Promise<ExamGuidePrintContext | null> {
    const baseRows = await db
        .select({
            location: exams.location,
            scheduledAt: exams.scheduledAt,
            startTime: exams.startTime,
            careType: exams.careType,
            clinicalIndication: exams.clinicalIndication,
            clinicName: clinics.name,
            clinicCnpj: clinics.cnpj,
            patientName: patients.name,
            cardNumber: patientHealthInsurances.cardNumber,
            insuranceName: healthInsurances.name,
            insuranceAnsCode: healthInsurances.ansCode,
            insuranceLogoKeyOrUrl: healthInsurances.logoUrl,
            doctorName: users.name,
            crm: doctors.crm,
            crmState: doctors.crmState,
            cboCode: doctors.cboCode,
        })
        .from(exams)
        .innerJoin(patients, eq(exams.patientId, patients.id))
        .innerJoin(clinics, eq(exams.clinicId, clinics.id))
        .leftJoin(healthInsurances, eq(exams.healthInsuranceId, healthInsurances.id))
        .leftJoin(
            patientHealthInsurances,
            and(
                eq(patientHealthInsurances.patientId, exams.patientId),
                eq(patientHealthInsurances.healthInsuranceId, exams.healthInsuranceId),
                eq(patientHealthInsurances.isActive, true)
            )
        )
        .leftJoin(doctors, eq(exams.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(eq(exams.id, examId), eq(exams.clinicId, clinicId)));

    const row = baseRows[0];
    if (!row || row.location !== "external") {
        return null;
    }

    const procRows = await db
        .select({
            tussCode: procedures.tussCode,
            name: procedures.name,
            quantity: examProcedures.quantity,
        })
        .from(examProcedures)
        .innerJoin(procedures, eq(examProcedures.procedureId, procedures.id))
        .where(eq(examProcedures.examId, examId))
        .orderBy(asc(procedures.name));

    return {
        clinicName: row.clinicName,
        clinicCnpj: row.clinicCnpj?.trim() || null,
        patientName: row.patientName,
        cardNumber: row.cardNumber?.trim() || null,
        insuranceName: row.insuranceName,
        insuranceAnsCode: row.insuranceAnsCode,
        insuranceLogoKeyOrUrl: row.insuranceLogoKeyOrUrl,
        doctorName: row.doctorName,
        crm: row.crm,
        crmState: row.crmState,
        cboCode: row.cboCode,
        careType: row.careType,
        clinicalIndication: row.clinicalIndication,
        scheduledAt: row.scheduledAt,
        guideDateTime: row.scheduledAt ?? row.startTime,
        procedures: procRows.map((p) => ({
            tussCode: p.tussCode?.trim() || null,
            name: p.name,
            quantity: p.quantity,
        })),
    };
}
