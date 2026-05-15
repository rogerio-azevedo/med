import { auth } from "@/auth";
import type { ProposalQueryFilters } from "@/db/queries/proposals";
import { getProposals, getProposalStats } from "@/db/queries/proposals";
import { proposalStatusEnum } from "@/db/schema";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getProducts } from "@/db/queries/products";
import { getActivePaymentTerms } from "@/db/queries/payment-terms";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProposalsTable } from "./_components/proposals-table";
import { ProposalStats } from "./_components/proposal-stats";
import { ProposalFilters } from "./_components/proposal-filters";
import { ProposalDialog } from "./_components/proposal-dialog";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseProposalQueryFilters(params: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
}): ProposalQueryFilters | undefined {
    const filters: ProposalQueryFilters = {};

    const statusRaw = params.status?.trim();
    if (
        statusRaw &&
        proposalStatusEnum.enumValues.includes(
            statusRaw as (typeof proposalStatusEnum.enumValues)[number]
        )
    ) {
        filters.status = statusRaw as (typeof proposalStatusEnum.enumValues)[number];
    }

    if (params.dateFrom && ISO_DATE.test(params.dateFrom)) {
        filters.dateFrom = params.dateFrom;
    }
    if (params.dateTo && ISO_DATE.test(params.dateTo)) {
        filters.dateTo = params.dateTo;
    }

    if (params.q) {
        filters.q = params.q;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
}

export default async function ProposalsPage({
    searchParams,
}: {
    searchParams: Promise<{
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        q?: string;
    }>;
}) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("proposals", "can_read");
    if (!allowed) redirect("/dashboard");

    const query = await searchParams;
    const queryFilters = parseProposalQueryFilters(query);

    const [proposals, stats, patients, products, paymentTerms] = await Promise.all([
        getProposals(clinicId, queryFilters),
        getProposalStats(clinicId, queryFilters),
        getPatientsByClinic(clinicId),
        getProducts(clinicId),
        getActivePaymentTerms(clinicId),
    ]);

    return (
        <div className="flex-1 space-y-4 p-6 pt-2">
            <PageHeader
                title="Orçamentos e Propostas"
                description="Gerencie o funil de vendas e rastreabilidade da clínica."
                actions={
                    <ProposalDialog patients={patients} products={products} paymentTerms={paymentTerms} />
                }
            />

            <ProposalStats stats={stats} />

            <div className="flex flex-col gap-4">
                <ProposalFilters
                    key={[
                        queryFilters?.status ?? "",
                        queryFilters?.dateFrom ?? "",
                        queryFilters?.dateTo ?? "",
                    ].join("|")}
                    defaultStatus={queryFilters?.status ?? ""}
                    defaultDateFrom={queryFilters?.dateFrom ?? ""}
                    defaultDateTo={queryFilters?.dateTo ?? ""}
                    defaultQ={query.q ?? ""}
                />


                <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                    <ProposalsTable proposals={proposals} />
                </div>
            </div>
        </div>
    );
}
