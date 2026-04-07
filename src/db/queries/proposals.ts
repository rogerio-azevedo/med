import { db } from "../index";
import { proposals, proposalItems, proposalStatusEnum } from "../schema";
import { asc, desc, eq, and, sql } from "drizzle-orm";

export async function getProposals(clinicId: string) {
    return db.query.proposals.findMany({
        where: eq(proposals.clinicId, clinicId),
        with: {
            patient: true,
            createdBy: {
                columns: {
                    name: true,
                },
            },
        },
        orderBy: [desc(proposals.createdAt)],
    });
}

export async function getProposalById(id: string) {
    return db.query.proposals.findFirst({
        where: eq(proposals.id, id),
        with: {
            patient: true,
            createdBy: true,
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
    items: (typeof proposalItems.$inferInsert)[]
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

export async function getProposalStats(clinicId: string) {
    const stats = await db
        .select({
            status: proposals.status,
            count: sql<number>`count(*)`,
            totalValue: sql<number>`sum(${proposals.totalAmount})`,
        })
        .from(proposals)
        .where(eq(proposals.clinicId, clinicId))
        .groupBy(proposals.status);
    
    return stats;
}
