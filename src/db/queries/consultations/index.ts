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
