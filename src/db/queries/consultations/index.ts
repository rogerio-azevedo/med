import { db } from "@/db";
import type { SQL } from "drizzle-orm";
import {
    consultations,
    consultationSoap,
    vitalSigns,
    icd10Codes,
    doctors,
    users,
    serviceTypes,
    patients,
    healthInsurances,
} from "@/db/schema";
import { eq, and, desc, or, ilike, isNull, ne, gte, lte, sql } from "drizzle-orm";
import type { consultationSchema, consultationSoapSchema, vitalSignsSchema } from "@/validations/medical-records";
import type { z } from "zod";

type ConsultationInsert = z.infer<typeof consultationSchema>;
type ConsultationSoapInput = z.infer<typeof consultationSoapSchema>;
type VitalSignsInput = z.infer<typeof vitalSignsSchema>;

/**
 * Retorna o histórico de consultas de um paciente com informações básicas e busca
 */
export async function getPatientConsultationsTimeline(
    patientId: string, 
    clinicId: string,
    searchTerm?: string
) {
    /** Cirurgias ficam apenas na tabela `surgeries` (evita duplicata e ícone/fluxo errado). */
    const notSurgeryWorkflow = or(
        isNull(serviceTypes.workflow),
        ne(serviceTypes.workflow, "surgery")
    ) as SQL;

    const whereConditions: SQL[] = [
        eq(consultations.patientId, patientId),
        eq(consultations.clinicId, clinicId),
        notSurgeryWorkflow,
    ];

    if (searchTerm) {
        const searchFilters = or(
            ilike(consultationSoap.subjective, `%${searchTerm}%`),
            ilike(consultationSoap.objective, `%${searchTerm}%`),
            ilike(consultationSoap.assessment, `%${searchTerm}%`),
            ilike(consultationSoap.plan, `%${searchTerm}%`),
            ilike(consultationSoap.diagnosisFreeText, `%${searchTerm}%`),
            ilike(icd10Codes.code, `%${searchTerm}%`),
            ilike(icd10Codes.description, `%${searchTerm}%`)
        );
        if (searchFilters) {
            whereConditions.push(searchFilters);
        }
    }

    return db
        .select({
            id: consultations.id,
            serviceTypeId: consultations.serviceTypeId,
            status: consultations.status,
            startTime: consultations.startTime,
            doctorName: users.name,
            serviceTypeName: serviceTypes.name,
            serviceTypeWorkflow: serviceTypes.workflow,
            serviceTypeSlug: serviceTypes.slug,
            serviceTypeTimelineIconKey: serviceTypes.timelineIconKey,
            serviceTypeTimelineColorHex: serviceTypes.timelineColorHex,
            diagnosis: consultationSoap.diagnosisFreeText,
            cidCode: icd10Codes.code,
            cidDescription: icd10Codes.description,
            parentConsultationId: consultations.parentConsultationId,
            healthInsuranceId: consultations.healthInsuranceId,
            hasReturn: sql<boolean>`(
                exists (
                    select 1
                    from ${consultations} c_ret
                    where c_ret.parent_consultation_id = ${consultations.id}
                      and c_ret.clinic_id = ${clinicId}::uuid
                )
            )`,
        })
        .from(consultations)
        .leftJoin(consultationSoap, eq(consultations.id, consultationSoap.consultationId))
        .leftJoin(icd10Codes, eq(consultationSoap.diagnosisCidId, icd10Codes.id))
        .leftJoin(serviceTypes, eq(consultations.serviceTypeId, serviceTypes.id))
        .leftJoin(doctors, eq(consultations.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(consultations.startTime));
}

export type WaitingEncounterRow = {
    id: string;
    patientId: string;
    patientName: string;
    startTime: Date;
    serviceTypeName: string | null;
    healthInsuranceName: string | null;
    encounterKind: "consultation" | "surgery";
};

/**
 * Fila de pré-atendimento (check-in): encontros aguardando médico.
 * Com `doctorId`, retorna apenas pacientes direcionados a esse médico.
 */
export async function getWaitingConsultationsForClinic(
    clinicId: string,
    doctorId?: string
): Promise<WaitingEncounterRow[]> {
    const conditions = [eq(consultations.clinicId, clinicId), eq(consultations.status, "waiting")];
    if (doctorId) {
        conditions.push(eq(consultations.doctorId, doctorId));
    }

    const rows = await db
        .select({
            id: consultations.id,
            patientId: consultations.patientId,
            patientName: patients.name,
            startTime: consultations.startTime,
            serviceTypeName: serviceTypes.name,
            healthInsuranceName: healthInsurances.name,
        })
        .from(consultations)
        .innerJoin(patients, eq(consultations.patientId, patients.id))
        .leftJoin(serviceTypes, eq(consultations.serviceTypeId, serviceTypes.id))
        .leftJoin(healthInsurances, eq(consultations.healthInsuranceId, healthInsurances.id))
        .where(and(...conditions))
        .orderBy(consultations.startTime);

    return rows.map((r) => ({ ...r, encounterKind: "consultation" as const }));
}

export type ClinicConsultationListRow = {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string | null;
    doctorName: string | null;
    status: string;
    startTime: Date;
    endTime: Date | null;
    serviceTypeName: string | null;
    healthInsuranceName: string | null;
    /** Já existe registro de retorno vinculado a esta consulta. */
    hasReturn: boolean;
    parentConsultationId: string | null;
};

export type GetAllConsultationsForClinicOptions = {
    doctorId?: string;
    patientId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
};

/**
 * Lista consultas da clínica para o painel Gestão (ordenadas por data mais recente).
 */
export async function getAllConsultationsForClinic(
    clinicId: string,
    options?: GetAllConsultationsForClinicOptions
): Promise<ClinicConsultationListRow[]> {
    const conditions: SQL[] = [eq(consultations.clinicId, clinicId)];

    if (options?.doctorId) {
        conditions.push(eq(consultations.doctorId, options.doctorId));
    }
    if (options?.patientId) {
        conditions.push(eq(consultations.patientId, options.patientId));
    }
    if (options?.status) {
        conditions.push(eq(consultations.status, options.status));
    }
    if (options?.dateFrom) {
        const start = new Date(options.dateFrom);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(consultations.startTime, start));
    }
    if (options?.dateTo) {
        const end = new Date(options.dateTo);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(consultations.startTime, end));
    }

    return db
        .select({
            id: consultations.id,
            patientId: consultations.patientId,
            patientName: patients.name,
            doctorId: consultations.doctorId,
            doctorName: users.name,
            status: consultations.status,
            startTime: consultations.startTime,
            endTime: consultations.endTime,
            serviceTypeName: serviceTypes.name,
            healthInsuranceName: healthInsurances.name,
            parentConsultationId: consultations.parentConsultationId,
            hasReturn: sql<boolean>`(
                exists (
                    select 1
                    from ${consultations} c_ret
                    where c_ret.parent_consultation_id = ${consultations.id}
                      and c_ret.clinic_id = ${clinicId}::uuid
                )
            )`,
        })
        .from(consultations)
        .innerJoin(patients, eq(consultations.patientId, patients.id))
        .leftJoin(doctors, eq(consultations.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .leftJoin(serviceTypes, eq(consultations.serviceTypeId, serviceTypes.id))
        .leftJoin(healthInsurances, eq(consultations.healthInsuranceId, healthInsurances.id))
        .where(and(...conditions))
        .orderBy(desc(consultations.startTime));
}

/**
 * Retorna os sinais vitais mais recentes do paciente
 */
export async function getPatientLatestVitals(patientId: string, clinicId: string) {
    const [latestVitals] = await db
        .select({
            id: vitalSigns.id,
            consultationId: vitalSigns.consultationId,
            weight: vitalSigns.weight,
            height: vitalSigns.height,
            bloodPressure: vitalSigns.bloodPressure,
            heartRate: vitalSigns.heartRate,
            respiratoryRate: vitalSigns.respiratoryRate,
            temperature: vitalSigns.temperature,
            oxygenSaturation: vitalSigns.oxygenSaturation,
            createdAt: vitalSigns.createdAt,
        })
        .from(vitalSigns)
        .innerJoin(consultations, eq(vitalSigns.consultationId, consultations.id))
        .where(
            and(
                eq(consultations.patientId, patientId),
                eq(consultations.clinicId, clinicId)
            )
        )
        .orderBy(desc(consultations.startTime), desc(vitalSigns.createdAt))
        .limit(1);

    return latestVitals ?? null;
}

/**
 * Retorna os detalhes completos de uma consulta específica
 */
export async function getConsultationDetails(consultationId: string, clinicId: string) {
    const consultation = await db.query.consultations.findFirst({
        where: and(
            eq(consultations.id, consultationId),
            eq(consultations.clinicId, clinicId)
        ),
        with: {
            soap: true,
            vitalSigns: true,
            prescriptions: true,
            examRequests: true,
            referrals: true,
            serviceType: true,
            healthInsurance: true,
        }
    });

    return consultation;
}

const consultationWithDoctorRelations = {
    soap: {
        with: {
            diagnosisCid: true,
        },
    },
    vitalSigns: true,
    prescriptions: true,
    examRequests: true,
    referrals: true,
    serviceType: true,
    healthInsurance: true,
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
} as const;

/**
 * Retorna os detalhes completos de uma consulta específica, incluindo o nome do médico
 */
export async function getConsultationDetailsWithDoctor(consultationId: string, clinicId: string) {
    const consultation = await db.query.consultations.findFirst({
        where: and(eq(consultations.id, consultationId), eq(consultations.clinicId, clinicId)),
        with: consultationWithDoctorRelations,
    });

    return consultation;
}

/**
 * Se esta consulta é a “mãe”, indica se já existe registro de retorno e o id dele.
 */
export async function getConsultationReturnStatus(consultationId: string, clinicId: string) {
    const child = await db.query.consultations.findFirst({
        where: and(
            eq(consultations.parentConsultationId, consultationId),
            eq(consultations.clinicId, clinicId)
        ),
        columns: { id: true },
    });
    return { hasReturn: !!child, returnConsultationId: child?.id as string | undefined };
}

/**
 * Mesmo payload de {@link getConsultationDetailsWithDoctor}, sem filtro de clínica (uso em página pública de verificação).
 */
export async function getConsultationDetailsWithDoctorById(consultationId: string) {
    return db.query.consultations.findFirst({
        where: eq(consultations.id, consultationId),
        with: consultationWithDoctorRelations,
    });
}

/**
 * Cria uma nova consulta (atendimento)
 */
export async function createConsultationQuery(data: ConsultationInsert) {
    return db.insert(consultations).values(data).returning();
}

/**
 * Salva/Atualiza o SOAP de uma consulta
 */
export async function upsertConsultationSoapQuery(data: ConsultationSoapInput) {
    return db
        .insert(consultationSoap)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: consultationSoap.consultationId,
            set: {
                subjective: data.subjective,
                objective: data.objective,
                assessment: data.assessment,
                diagnosisCidId: data.diagnosisCidId,
                diagnosisFreeText: data.diagnosisFreeText,
                plan: data.plan,
                updatedAt: new Date(),
            }
        })
        .returning();
}

/**
 * Salva/Atualiza os sinais vitais de uma consulta
 */
export async function upsertVitalSignsQuery(data: VitalSignsInput) {
    const [existingVitals] = await db
        .select({ id: vitalSigns.id })
        .from(vitalSigns)
        .where(eq(vitalSigns.consultationId, data.consultationId))
        .limit(1);

    if (existingVitals) {
        return db
            .update(vitalSigns)
            .set({
                weight: data.weight,
                height: data.height,
                bloodPressure: data.bloodPressure,
                heartRate: data.heartRate,
                respiratoryRate: data.respiratoryRate,
                temperature: data.temperature,
                oxygenSaturation: data.oxygenSaturation,
            })
            .where(eq(vitalSigns.id, existingVitals.id))
            .returning();
    }

    return db
        .insert(vitalSigns)
        .values(data)
        .returning();
}

/**
 * Exclui uma consulta e todos os seus dados relacionados
 */
export async function deleteConsultationQuery(consultationId: string, clinicId: string) {
    // Como os dados (SOAP, vitais, etc) devem ter FK com CASCADE, 
    // deletar a consulta deve ser suficiente.
    // Mas vamos verificar se as FKs têm CASCADE.
    return db
        .delete(consultations)
        .where(
            and(
                eq(consultations.id, consultationId),
                eq(consultations.clinicId, clinicId)
            )
        )
        .returning();
}
