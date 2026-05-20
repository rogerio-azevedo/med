import { db } from "@/db";
import type { SQL } from "drizzle-orm";
import {
    exams,
    examProcedures,
    procedures,
    doctors,
    users,
    serviceTypes,
    patients,
    healthInsurances,
    examRequests,
} from "@/db/schema";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

export type PatientExamTimelineRow = {
    id: string;
    serviceTypeId: string | null;
    status: string;
    location: string;
    startTime: Date;
    doctorName: string | null;
    serviceTypeName: string | null;
    serviceTypeWorkflow: string | null;
    serviceTypeSlug: string | null;
    serviceTypeTimelineIconKey: string | null;
    serviceTypeTimelineColorHex: string | null;
    /** Resumo: procedimentos ou trecho das notas */
    summary: string | null;
    consultationId: string | null;
};

/**
 * Exames do paciente para a timeline do prontuário.
 */
export async function getPatientExamsTimeline(
    patientId: string,
    clinicId: string,
    searchTerm?: string
): Promise<PatientExamTimelineRow[]> {
    const procedureAgg = sql<string | null>`(
        select string_agg(${procedures.name}, ', ' order by ${procedures.name})
        from ${examProcedures}
        inner join ${procedures} on ${examProcedures.procedureId} = ${procedures.id}
        where ${examProcedures.examId} = ${exams.id}
    )`;

    const whereConditions: SQL[] = [eq(exams.patientId, patientId), eq(exams.clinicId, clinicId)];

    if (searchTerm?.trim()) {
        const q = `%${searchTerm.trim()}%`;
        const searchFilters = or(
            ilike(exams.notes, q),
            ilike(serviceTypes.name, q),
            ilike(users.name, q),
            sql`exists (
                select 1 from ${examProcedures} ep
                inner join ${procedures} p on ep.procedure_id = p.id
                where ep.exam_id = ${exams.id}
                  and p.name ilike ${q}
            )`
        );
        if (searchFilters) {
            whereConditions.push(searchFilters);
        }
    }

    const rows = await db
        .select({
            id: exams.id,
            serviceTypeId: exams.serviceTypeId,
            status: exams.status,
            location: exams.location,
            startTime: exams.startTime,
            doctorName: users.name,
            serviceTypeName: serviceTypes.name,
            serviceTypeWorkflow: serviceTypes.workflow,
            serviceTypeSlug: serviceTypes.slug,
            serviceTypeTimelineIconKey: serviceTypes.timelineIconKey,
            serviceTypeTimelineColorHex: serviceTypes.timelineColorHex,
            notesSnippet: exams.notes,
            procedureList: procedureAgg,
            consultationId: exams.consultationId,
        })
        .from(exams)
        .leftJoin(doctors, eq(exams.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .leftJoin(serviceTypes, eq(exams.serviceTypeId, serviceTypes.id))
        .where(and(...whereConditions))
        .orderBy(desc(exams.startTime));

    return rows.map((r) => {
        const proc = r.procedureList?.trim() || null;
        const notes = r.notesSnippet?.trim() || null;
        let summary: string | null = proc;
        if (!summary && notes) {
            summary = notes.length > 120 ? `${notes.slice(0, 117)}…` : notes;
        }
        return {
            id: r.id,
            serviceTypeId: r.serviceTypeId ?? null,
            status: r.status,
            location: r.location,
            startTime: r.startTime,
            doctorName: r.doctorName ?? null,
            serviceTypeName: r.serviceTypeName ?? null,
            serviceTypeWorkflow: r.serviceTypeWorkflow ?? null,
            serviceTypeSlug: r.serviceTypeSlug ?? null,
            serviceTypeTimelineIconKey: r.serviceTypeTimelineIconKey ?? null,
            serviceTypeTimelineColorHex: r.serviceTypeTimelineColorHex ?? null,
            summary,
            consultationId: r.consultationId ?? null,
        };
    });
}

export type ClinicExamListRow = {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string | null;
    doctorName: string | null;
    status: string;
    location: string;
    startTime: Date;
    endTime: Date | null;
    serviceTypeName: string | null;
    healthInsuranceName: string | null;
    consultationId: string | null;
};

export type GetAllExamsForClinicOptions = {
    doctorId?: string;
    patientId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
};

/**
 * Lista exames da clínica (Gestão).
 */
export async function getAllExamsForClinic(
    clinicId: string,
    options?: GetAllExamsForClinicOptions
): Promise<ClinicExamListRow[]> {
    const conditions: SQL[] = [eq(exams.clinicId, clinicId)];

    if (options?.doctorId) {
        conditions.push(eq(exams.doctorId, options.doctorId));
    }
    if (options?.patientId) {
        conditions.push(eq(exams.patientId, options.patientId));
    }
    if (options?.status) {
        conditions.push(eq(exams.status, options.status as (typeof exams.$inferSelect)["status"]));
    }
    if (options?.dateFrom) {
        const start = new Date(options.dateFrom);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(exams.startTime, start));
    }
    if (options?.dateTo) {
        const end = new Date(options.dateTo);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(exams.startTime, end));
    }

    return db
        .select({
            id: exams.id,
            patientId: exams.patientId,
            patientName: patients.name,
            doctorId: exams.doctorId,
            doctorName: users.name,
            status: exams.status,
            location: exams.location,
            startTime: exams.startTime,
            endTime: exams.endTime,
            serviceTypeName: serviceTypes.name,
            healthInsuranceName: healthInsurances.name,
            consultationId: exams.consultationId,
        })
        .from(exams)
        .innerJoin(patients, eq(exams.patientId, patients.id))
        .leftJoin(doctors, eq(exams.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .leftJoin(serviceTypes, eq(exams.serviceTypeId, serviceTypes.id))
        .leftJoin(healthInsurances, eq(exams.healthInsuranceId, healthInsurances.id))
        .where(and(...conditions))
        .orderBy(desc(exams.startTime));
}

const examDetailRelations = {
    procedureLinks: {
        with: {
            procedure: true,
        },
    },
    doctor: {
        with: {
            user: {
                columns: {
                    name: true,
                    image: true,
                },
            },
        },
    },
    patient: true,
    clinic: true,
    consultation: {
        columns: {
            id: true,
            startTime: true,
            status: true,
        },
    },
    examRequest: true,
    serviceType: true,
    healthInsurance: true,
} as const;

export async function getExamDetails(examId: string, clinicId: string) {
    return db.query.exams.findFirst({
        where: and(eq(exams.id, examId), eq(exams.clinicId, clinicId)),
        with: examDetailRelations,
    });
}

export async function deleteExamQuery(examId: string, clinicId: string) {
    return db
        .delete(exams)
        .where(and(eq(exams.id, examId), eq(exams.clinicId, clinicId)))
        .returning({ id: exams.id });
}

type ExamInsertValues = typeof exams.$inferInsert;

export async function insertExamQuery(values: ExamInsertValues) {
    const [row] = await db.insert(exams).values(values).returning();
    return row ?? null;
}

export async function updateExamQuery(
    examId: string,
    clinicId: string,
    patch: Partial<
        Pick<
            ExamInsertValues,
            | "doctorId"
            | "consultationId"
            | "examRequestId"
            | "serviceTypeId"
            | "healthInsuranceId"
            | "status"
            | "location"
            | "notes"
            | "scheduledAt"
            | "startTime"
            | "endTime"
            | "updatedAt"
        >
    >
) {
    const [row] = await db
        .update(exams)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(exams.id, examId), eq(exams.clinicId, clinicId)))
        .returning();
    return row ?? null;
}

export async function insertExamProcedureQuery(input: {
    examId: string;
    procedureId: string;
    quantity?: number;
    notes?: string | null;
}) {
    const [row] = await db
        .insert(examProcedures)
        .values({
            examId: input.examId,
            procedureId: input.procedureId,
            quantity: input.quantity ?? 1,
            notes: input.notes ?? null,
        })
        .returning();
    return row ?? null;
}

export async function deleteExamProcedureQuery(examProcedureId: string, examId: string) {
    const deleted = await db
        .delete(examProcedures)
        .where(and(eq(examProcedures.id, examProcedureId), eq(examProcedures.examId, examId)))
        .returning({ id: examProcedures.id });
    return deleted[0] ?? null;
}

export async function getExamMinimal(examId: string, clinicId: string) {
    const row = await db.query.exams.findFirst({
        where: and(eq(exams.id, examId), eq(exams.clinicId, clinicId)),
        columns: {
            id: true,
            patientId: true,
            doctorId: true,
            clinicId: true,
            consultationId: true,
            examRequestId: true,
            status: true,
        },
    });
    return row ?? null;
}

export async function setExamRequestFulfilledQuery(
    examRequestId: string,
    clinicId: string,
    fulfilledByExamId: string | null
) {
    await db
        .update(examRequests)
        .set({ fulfilledByExamId })
        .where(and(eq(examRequests.id, examRequestId), eq(examRequests.clinicId, clinicId)));
}
