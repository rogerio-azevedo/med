import { db } from "@/db";
import { surgeries, surgeryProcedures, doctors, users, serviceTypes, healthInsurances, patients } from "@/db/schema";
import type { WaitingEncounterRow } from "@/db/queries/consultations";
import { and, desc, eq, sql } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

export type SurgeryInsert = InferInsertModel<typeof surgeries>;

/**
 * Linha da timeline de cirurgias do paciente.
 */
export async function getPatientSurgeriesTimeline(patientId: string, clinicId: string) {
    const rows = await db
        .select({
            id: surgeries.id,
            serviceTypeId: surgeries.serviceTypeId,
            status: surgeries.status,
            createdAt: surgeries.createdAt,
            surgeryDate: surgeries.surgeryDate,
            serviceTypeName: serviceTypes.name,
            serviceTypeSlug: serviceTypes.slug,
            serviceTypeTimelineIconKey: serviceTypes.timelineIconKey,
            serviceTypeTimelineColorHex: serviceTypes.timelineColorHex,
            surgeonName: users.name,
        })
        .from(surgeries)
        .leftJoin(serviceTypes, eq(surgeries.serviceTypeId, serviceTypes.id))
        .leftJoin(doctors, eq(surgeries.surgeonId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(eq(surgeries.patientId, patientId), eq(surgeries.clinicId, clinicId)))
        .orderBy(
            desc(
                sql`coalesce(${surgeries.surgeryDate}::timestamp, ${surgeries.createdAt})`
            )
        );

    return rows.map((r) => ({
        id: r.id,
        serviceTypeId: r.serviceTypeId,
        status: r.status,
        startTime: r.surgeryDate ?? r.createdAt,
        doctorName: r.surgeonName,
        diagnosis: null as string | null,
        cidCode: null as string | null,
        serviceTypeName: r.serviceTypeName ?? "Cirurgia",
        serviceTypeWorkflow: "surgery" as const,
        serviceTypeSlug: r.serviceTypeSlug,
        serviceTypeTimelineIconKey: r.serviceTypeTimelineIconKey,
        serviceTypeTimelineColorHex: r.serviceTypeTimelineColorHex,
        timelineKind: "surgery" as const,
    }));
}

export async function getSurgeryByCheckInId(checkInId: string, clinicId: string) {
    return db.query.surgeries.findFirst({
        where: and(eq(surgeries.checkInId, checkInId), eq(surgeries.clinicId, clinicId)),
    });
}

export async function getWaitingSurgeriesForClinic(
    clinicId: string,
    doctorId?: string
): Promise<WaitingEncounterRow[]> {
    const conditions = [eq(surgeries.clinicId, clinicId), eq(surgeries.status, "waiting")];
    if (doctorId) {
        conditions.push(eq(surgeries.surgeonId, doctorId));
    }

    return db
        .select({
            id: surgeries.id,
            patientId: surgeries.patientId,
            patientName: patients.name,
            startTime: surgeries.createdAt,
            serviceTypeName: serviceTypes.name,
            healthInsuranceName: healthInsurances.name,
        })
        .from(surgeries)
        .innerJoin(patients, eq(surgeries.patientId, patients.id))
        .leftJoin(serviceTypes, eq(surgeries.serviceTypeId, serviceTypes.id))
        .leftJoin(healthInsurances, eq(surgeries.healthInsuranceId, healthInsurances.id))
        .where(and(...conditions))
        .orderBy(surgeries.createdAt)
        .then((rows) =>
            rows.map((r) => ({
                ...r,
                encounterKind: "surgery" as const,
            }))
        );
}

export async function createSurgeryQuery(data: SurgeryInsert) {
    const [row] = await db.insert(surgeries).values(data).returning();
    return row;
}

export async function updateSurgeryQuery(
    surgeryId: string,
    clinicId: string,
    data: Partial<Omit<SurgeryInsert, "id" | "createdAt">>
) {
    const [row] = await db
        .update(surgeries)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(surgeries.id, surgeryId), eq(surgeries.clinicId, clinicId)))
        .returning();
    return row;
}

export async function replaceSurgeryProceduresQuery(surgeryId: string, procedureIds: string[]) {
    await db.delete(surgeryProcedures).where(eq(surgeryProcedures.surgeryId, surgeryId));
    if (procedureIds.length === 0) return;
    await db.insert(surgeryProcedures).values(
        procedureIds.map((procedureId) => ({
            surgeryId,
            procedureId,
        }))
    );
}

export async function getSurgeryDetails(surgeryId: string, clinicId: string) {
    const row = await db.query.surgeries.findFirst({
        where: and(eq(surgeries.id, surgeryId), eq(surgeries.clinicId, clinicId)),
        with: {
            patient: true,
            serviceType: true,
            healthInsurance: true,
            hospital: true,
            procedureLinks: {
                with: {
                    procedure: true,
                },
            },
            surgeon: { with: { user: { columns: { name: true, id: true } } } },
            firstAux: { with: { user: { columns: { name: true, id: true } } } },
            secondAux: { with: { user: { columns: { name: true, id: true } } } },
            thirdAux: { with: { user: { columns: { name: true, id: true } } } },
            anesthetist: { with: { user: { columns: { name: true, id: true } } } },
            instrumentist: { with: { user: { columns: { name: true, id: true } } } },
        },
    });
    return row;
}

export async function getSurgeryProcedureIds(surgeryId: string): Promise<string[]> {
    const rows = await db
        .select({ procedureId: surgeryProcedures.procedureId })
        .from(surgeryProcedures)
        .where(eq(surgeryProcedures.surgeryId, surgeryId));
    return rows.map((r) => r.procedureId);
}

export async function deleteSurgeryQuery(surgeryId: string, clinicId: string) {
    return db
        .delete(surgeries)
        .where(and(eq(surgeries.id, surgeryId), eq(surgeries.clinicId, clinicId)))
        .returning();
}
