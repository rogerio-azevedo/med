import { db } from "@/db";
import { patientPlans, patients, products, patientPlanStatusEnum } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { getProposalById } from "@/db/queries/proposals";
import { addMonths, format } from "date-fns";

export type PatientPlanListFilters = {
    /** ISO date inclusive */
    dateFrom?: string;
    /** ISO date inclusive */
    dateTo?: string;
    status?: (typeof patientPlanStatusEnum.enumValues)[number];
    q?: string;
    activeOnly?: boolean;
};

export type PatientPlanListRow = {
    id: string;
    patientId: string;
    patientName: string;
    productId: string;
    productName: string;
    proposalId: string | null;
    status: (typeof patientPlanStatusEnum.enumValues)[number];
    startDate: string;
    endDate: string | null;
    createdAt: Date;
};

function buildPatientPlanWhere(
    clinicId: string,
    filters?: PatientPlanListFilters
): SQL | undefined {
    const parts: SQL[] = [eq(patientPlans.clinicId, clinicId)];

    if (filters?.status) {
        parts.push(eq(patientPlans.status, filters.status));
    }

    if (filters?.activeOnly) {
        parts.push(eq(patientPlans.status, "active"));
    }

    if (filters?.dateFrom) {
        parts.push(gte(patientPlans.startDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
        parts.push(lte(patientPlans.startDate, filters.dateTo));
    }

    if (filters?.q?.trim()) {
        const s = `%${filters.q.trim()}%`;
        parts.push(
            or(ilike(patients.name, s), ilike(products.name, s))!
        );
    }

    return and(...parts);
}

export async function getPatientPlans(
    clinicId: string,
    filters?: PatientPlanListFilters
): Promise<PatientPlanListRow[]> {
    const whereClause = buildPatientPlanWhere(clinicId, filters);

    const rows = await db
        .select({
            id: patientPlans.id,
            patientId: patientPlans.patientId,
            patientName: patients.name,
            productId: patientPlans.productId,
            productName: products.name,
            proposalId: patientPlans.proposalId,
            status: patientPlans.status,
            startDate: patientPlans.startDate,
            endDate: patientPlans.endDate,
            createdAt: patientPlans.createdAt,
        })
        .from(patientPlans)
        .innerJoin(patients, eq(patientPlans.patientId, patients.id))
        .innerJoin(products, eq(patientPlans.productId, products.id))
        .where(whereClause)
        .orderBy(desc(patientPlans.startDate), asc(patients.name));

    return rows.map((r) => ({
        ...r,
        startDate:
            typeof r.startDate === "string"
                ? r.startDate
                : format(r.startDate as Date, "yyyy-MM-dd"),
        endDate:
            r.endDate == null
                ? null
                : typeof r.endDate === "string"
                  ? r.endDate
                  : format(r.endDate as Date, "yyyy-MM-dd"),
    }));
}

export async function getActivePatientPlans(clinicId: string) {
    return getPatientPlans(clinicId, { activeOnly: true });
}

export async function createPatientPlan(data: typeof patientPlans.$inferInsert) {
    const [row] = await db.insert(patientPlans).values(data).returning();
    return row;
}

export async function updatePatientPlanStatus(
    id: string,
    clinicId: string,
    status: (typeof patientPlanStatusEnum.enumValues)[number]
) {
    const [row] = await db
        .update(patientPlans)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(patientPlans.id, id), eq(patientPlans.clinicId, clinicId)))
        .returning();
    return row;
}

/**
 * Gera linhas em `patient_plans` quando uma proposta é ganha (itens `plan_package`).
 * Idempotente: não duplica combinando proposal_id + product_id.
 */
export async function syncPatientPlansForWonProposal(
    clinicId: string,
    proposalId: string
): Promise<{ created: number }> {
    const proposal = await getProposalById(proposalId, clinicId);
    if (!proposal || proposal.status !== "won" || !proposal.wonAt) {
        return { created: 0 };
    }

    const wonAt = proposal.wonAt;
    const startDateStr = format(wonAt, "yyyy-MM-dd");

    let created = 0;
    for (const item of proposal.items ?? []) {
        const product = item.product;
        if (!product || product.type !== "plan_package") continue;

        const [existing] = await db
            .select({ id: patientPlans.id })
            .from(patientPlans)
            .where(
                and(
                    eq(patientPlans.proposalId, proposal.id),
                    eq(patientPlans.productId, item.productId)
                )
            )
            .limit(1);

        if (existing) continue;

        let endDateStr: string | null = null;
        if (product.durationMonths != null && product.durationMonths > 0) {
            const end = addMonths(wonAt, product.durationMonths);
            endDateStr = format(end, "yyyy-MM-dd");
        }

        await db.insert(patientPlans).values({
            clinicId,
            patientId: proposal.patientId,
            proposalId: proposal.id,
            productId: item.productId,
            status: "active",
            startDate: startDateStr,
            endDate: endDateStr,
            notes:
                item.quantity > 1
                    ? `Quantidade na proposta: ${item.quantity}`
                    : null,
        });
        created += 1;
    }

    return { created };
}
