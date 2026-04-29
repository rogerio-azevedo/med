import { db } from "@/db";
import { proposals, proposalItems, proposalStatusEnum } from "@/db/schema";
import { desc, eq, and, sql, gte, lte } from "drizzle-orm";

export type ProposalQueryFilters = {
    status?: (typeof proposalStatusEnum.enumValues)[number];
    /** ISO date `YYYY-MM-DD` (inclusive), compared em UTC */
    dateFrom?: string;
    /** ISO date `YYYY-MM-DD` (inclusive), compared em UTC */
    dateTo?: string;
};

function buildProposalWhere(clinicId: string, filters?: ProposalQueryFilters) {
    const conditions = [eq(proposals.clinicId, clinicId)];

    if (filters?.status) {
        conditions.push(eq(proposals.status, filters.status));
    }

    if (filters?.dateFrom) {
        const d = new Date(`${filters.dateFrom}T00:00:00.000Z`);
        if (!Number.isNaN(d.getTime())) {
            conditions.push(gte(proposals.createdAt, d));
        }
    }

    if (filters?.dateTo) {
        const d = new Date(`${filters.dateTo}T23:59:59.999Z`);
        if (!Number.isNaN(d.getTime())) {
            conditions.push(lte(proposals.createdAt, d));
        }
    }

    return and(...conditions);
}

export async function getProposals(clinicId: string, filters?: ProposalQueryFilters) {
    return db.query.proposals.findMany({
        where: buildProposalWhere(clinicId, filters),
        with: {
            patient: true,
            createdBy: {
                columns: {
                    name: true,
                },
            },
            paymentTerm: true,
        },
        orderBy: [desc(proposals.createdAt)],
    });
}

export async function getProposalById(id: string, clinicId: string) {
    return db.query.proposals.findFirst({
        where: and(eq(proposals.id, id), eq(proposals.clinicId, clinicId)),
        with: {
            patient: true,
            createdBy: true,
            paymentTerm: true,
            items: {
                with: {
                    product: true,
                }
            },
        },
    });
}

export async function getNextProposalNumber(clinicId: string) {
    const result = await db
        .select({
            maxNumber: sql<number>`max(${proposals.number})`,
        })
        .from(proposals)
        .where(eq(proposals.clinicId, clinicId));

    const nextNumber = (result[0]?.maxNumber || 0) + 1;
    return nextNumber;
}

export async function createProposal(
    data: typeof proposals.$inferInsert,
    items: Array<Omit<typeof proposalItems.$inferInsert, "proposalId">>
) {
    // Generate the proposal ID upfront to link items in a batch operation
    const proposalId = crypto.randomUUID();
    const proposalWithId = { ...data, id: proposalId };

    const itemsWithProposalId = items.map((item) => ({
        ...item,
        proposalId: proposalId,
    }));

    // Use db.batch for atomic execution in neon-http driver
    await db.batch([
        db.insert(proposals).values(proposalWithId),
        ...(itemsWithProposalId.length > 0 
            ? [db.insert(proposalItems).values(itemsWithProposalId)] 
            : []),
    ]);

    return proposalWithId;
}

export async function updateProposal(
    id: string,
    clinicId: string,
    data: Partial<typeof proposals.$inferInsert>,
    items: Array<Omit<typeof proposalItems.$inferInsert, "proposalId">>
) {
    const nextItems = items.map((item) => ({
        ...item,
        proposalId: id,
    }));

    await db.batch([
        db
            .update(proposals)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(eq(proposals.id, id), eq(proposals.clinicId, clinicId))),
        db.delete(proposalItems).where(eq(proposalItems.proposalId, id)),
        ...(nextItems.length > 0 ? [db.insert(proposalItems).values(nextItems)] : []),
    ]);

    return getProposalById(id, clinicId);
}

export async function updateProposalStatus(
    id: string,
    status: typeof proposalStatusEnum.enumValues[number],
    userId: string
) {
    const updateData: Partial<typeof proposals.$inferInsert> = {
        status,
        updatedAt: new Date(),
    };

    if (status === "won") {
        updateData.wonById = userId;
        updateData.wonAt = new Date();
    } else if (status === "cancelled") {
        updateData.cancelledById = userId;
        updateData.cancelledAt = new Date();
    } else if (status === "draft") {
        updateData.reopenedById = userId;
    }

    const [updated] = await db
        .update(proposals)
        .set(updateData)
        .where(eq(proposals.id, id))
        .returning();
    
    return updated;
}

export async function getProposalStats(clinicId: string, filters?: ProposalQueryFilters) {
    const stats = await db
        .select({
            status: proposals.status,
            count: sql<number>`count(*)`,
            totalValue: sql<number>`sum(${proposals.totalAmount})`,
        })
        .from(proposals)
        .where(buildProposalWhere(clinicId, filters))
        .groupBy(proposals.status);

    return stats.map((s) => ({
        status: s.status,
        count: Number(s.count ?? 0),
        totalValue: Number(s.totalValue ?? 0),
    }));
}
