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
import { eq, and, desc, or, ilike, isNull, ne } from "drizzle-orm";
import type { consultationSchema, consultationSoapSchema, vitalSignsSchema } from "@/lib/validations/medical-records";
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
