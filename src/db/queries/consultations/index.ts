import { db } from "@/db";
import { 
    consultations, 
    consultationSoap, 
    vitalSigns, 
    prescriptions, 
    examRequests, 
    referrals,
    icd10Codes,
    doctors,
    users
} from "@/db/schema";
import { eq, and, desc, sql, or, ilike } from "drizzle-orm";

/**
 * Retorna o histórico de consultas de um paciente com informações básicas e busca
 */
export async function getPatientConsultationsTimeline(
    patientId: string, 
    clinicId: string,
    searchTerm?: string
) {
    const whereConditions = [
        eq(consultations.patientId, patientId),
        eq(consultations.clinicId, clinicId)
    ];

    if (searchTerm) {
        whereConditions.push(
            or(
                ilike(consultationSoap.subjective, `%${searchTerm}%`),
                ilike(consultationSoap.objective, `%${searchTerm}%`),
                ilike(consultationSoap.assessment, `%${searchTerm}%`),
                ilike(consultationSoap.plan, `%${searchTerm}%`),
                ilike(consultationSoap.diagnosisFreeText, `%${searchTerm}%`),
                ilike(icd10Codes.code, `%${searchTerm}%`),
                ilike(icd10Codes.description, `%${searchTerm}%`)
            ) as any
        );
    }

    return db
        .select({
            id: consultations.id,
            type: consultations.type,
            status: consultations.status,
            startTime: consultations.startTime,
            doctorName: users.name,
            diagnosis: consultationSoap.diagnosisFreeText,
            cidCode: icd10Codes.code,
            cidDescription: icd10Codes.description,
        })
        .from(consultations)
        .leftJoin(consultationSoap, eq(consultations.id, consultationSoap.consultationId))
        .leftJoin(icd10Codes, eq(consultationSoap.diagnosisCidId, icd10Codes.id))
        .innerJoin(doctors, eq(consultations.doctorId, doctors.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(and(...whereConditions))
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
        }
    });

    return consultation;
}

/**
 * Retorna os detalhes completos de uma consulta específica, incluindo o nome do médico
 */
export async function getConsultationDetailsWithDoctor(consultationId: string, clinicId: string) {
    const consultation = await db.query.consultations.findFirst({
        where: and(
            eq(consultations.id, consultationId),
            eq(consultations.clinicId, clinicId)
        ),
        with: {
            soap: {
                with: {
                    diagnosisCid: true,
                }
            },
            vitalSigns: true,
            prescriptions: true,
            examRequests: true,
            referrals: true,
            doctor: {
                with: {
                    user: {
                        columns: {
                            name: true,
                            image: true,
                        }
                    }
                }
            }
        }
    });

    return consultation;
}

/**
 * Cria uma nova consulta (atendimento)
 */
export async function createConsultationQuery(data: any) {
    return db.insert(consultations).values(data).returning();
}

/**
 * Salva/Atualiza o SOAP de uma consulta
 */
export async function upsertConsultationSoapQuery(data: any) {
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
export async function upsertVitalSignsQuery(data: any) {
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
