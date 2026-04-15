import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, clinics } from "@/db/schema";
import { formatClinicAddressLine } from "@/lib/format-clinic-address";
import { buildProposalPaymentDisplayText } from "@/lib/format-proposal-payment-pdf";
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
    /** OBS / condições gerais fixas da clínica no PDF; null = usar padrão do código. */
    proposalGeneralNotes: string | null;
    /** Condição de pagamento (prazo + modalidade + descrição) — exibida só no cabeçalho do PDF. */
    proposalPaymentDisplay: string;
    id: string;
    number: number;
    status: string;
    totalAmount: number;
    createdAt: Date;
    validUntil: string | null;
    notes: string | null;
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
            columns: {
                name: true,
                phone: true,
                logoUrl: true,
                proposalGeneralNotes: true,
            },
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
        proposalGeneralNotes: clinicRow?.proposalGeneralNotes?.trim() || null,
        proposalPaymentDisplay: buildProposalPaymentDisplayText(proposal),
        id: proposal.id,
        number: proposal.number,
        status: proposal.status,
        totalAmount: proposal.totalAmount,
        createdAt: proposal.createdAt,
        validUntil: proposal.validUntil,
        notes: proposal.notes,
        patientName: proposal.patient?.name ?? null,
        createdByName: proposal.createdBy?.name ?? null,
        items,
    };
}
