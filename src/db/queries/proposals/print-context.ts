import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, clinics } from "@/db/schema";
import { formatClinicAddressLine } from "@/lib/format-clinic-address";
import { getProposalById } from "@/db/queries/proposals";

export type ProposalPrintItem = {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description: string | null;
    productName: string | null;
};

export type ProposalPrintContext = {
    clinicName: string;
    clinicLogoUrl: string | null;
    clinicPhone: string | null;
    clinicAddress: string | null;
    /** Texto completo de condições/pagamento; se null, o PDF usa o fallback padrão no componente. */
    proposalConditions: string | null;
    id: string;
    number: number;
    status: string;
    totalAmount: number;
    createdAt: Date;
    validUntil: string | null;
    notes: string | null;
    paymentTermLabel: string | null;
    patientName: string | null;
    createdByName: string | null;
    items: ProposalPrintItem[];
};

async function resolveClinicPrimaryAddress(clinicId: string): Promise<string | null> {
    const rows = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.entityType, "clinic"), eq(addresses.entityId, clinicId)));
    if (!rows.length) return null;
    const chosen = rows.find((r) => r.isPrimary) ?? rows[0];
    return formatClinicAddressLine(chosen);
}

export async function getProposalPrintContext(
    id: string,
    clinicId: string
): Promise<ProposalPrintContext | null> {
    const proposal = await getProposalById(id, clinicId);
    if (!proposal) return null;

    const [clinicRow, addressLine] = await Promise.all([
        db.query.clinics.findFirst({
            where: eq(clinics.id, clinicId),
            columns: { name: true, phone: true, logoUrl: true, proposalConditions: true },
        }),
        resolveClinicPrimaryAddress(clinicId),
    ]);

    const items: ProposalPrintItem[] = proposal.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        description: item.description,
        productName: item.product?.name ?? null,
    }));

    return {
        clinicName: clinicRow?.name?.trim() || "Clínica",
        clinicLogoUrl: clinicRow?.logoUrl?.trim() || null,
        clinicPhone: clinicRow?.phone?.trim() || null,
        clinicAddress: addressLine,
        proposalConditions: clinicRow?.proposalConditions?.trim() || null,
        id: proposal.id,
        number: proposal.number,
        status: proposal.status,
        totalAmount: proposal.totalAmount,
        createdAt: proposal.createdAt,
        validUntil: proposal.validUntil,
        notes: proposal.notes,
        paymentTermLabel: proposal.paymentTermLabel,
        patientName: proposal.patient?.name ?? null,
        createdByName: proposal.createdBy?.name ?? null,
        items,
    };
}
