import { auth } from "@/auth";
import type { ProposalQueryFilters } from "@/db/queries/proposals";
import { getProposals, getProposalStats } from "@/db/queries/proposals";
import { proposalStatusEnum } from "@/db/schema";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getProducts } from "@/db/queries/products";
import { getActivePaymentTerms } from "@/db/queries/payment-terms";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { ProposalsTable } from "./_components/proposals-table";
import { ProposalStats } from "./_components/proposal-stats";
import { ProposalFilters } from "./_components/proposal-filters";
import { ProposalsPageHeader } from "./_components/proposals-page-header";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseProposalQueryFilters(params: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
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

    return Object.keys(filters).length > 0 ? filters : undefined;
}

export default async function ProposalsPage({
    searchParams,
}: {
    searchParams: Promise<{
        status?: string;
        dateFrom?: string;
        dateTo?: string;
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
        <div className="flex-1 space-y-8 p-8 pt-6">
            <ProposalsPageHeader patients={patients} products={products} paymentTerms={paymentTerms} />

            <ProposalStats stats={stats} />

            <div className="flex flex-col gap-6">
                <ProposalFilters
                    key={[
                        queryFilters?.status ?? "",
                        queryFilters?.dateFrom ?? "",
                        queryFilters?.dateTo ?? "",
                    ].join("|")}
                    defaultStatus={queryFilters?.status ?? ""}
                    defaultDateFrom={queryFilters?.dateFrom ?? ""}
                    defaultDateTo={queryFilters?.dateTo ?? ""}
                />

                <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Buscar por paciente ou número..."
                        className="pl-12 h-12 bg-white border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 focus:border-primary transition-all text-base"
                    />
                </div>

                <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                    <ProposalsTable proposals={proposals} />
                </div>
            </div>
        </div>
    );
}
