import { auth } from "@/auth";
import { getPatientPlans, type PatientPlanListFilters } from "@/db/queries/patient-plans";
import { patientPlanStatusEnum } from "@/db/schema";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { PatientPlansFilters } from "./_components/patient-plans-filters";
import { PatientPlansTable } from "./_components/patient-plans-table";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseFilters(params: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
}): PatientPlanListFilters | undefined {
    const filters: PatientPlanListFilters = {};

    const st = params.status?.trim();
    if (
        st &&
        patientPlanStatusEnum.enumValues.includes(
            st as (typeof patientPlanStatusEnum.enumValues)[number]
        )
    ) {
        filters.status = st as (typeof patientPlanStatusEnum.enumValues)[number];
    }

    if (params.dateFrom && ISO_DATE.test(params.dateFrom)) {
        filters.dateFrom = params.dateFrom;
    }
    if (params.dateTo && ISO_DATE.test(params.dateTo)) {
        filters.dateTo = params.dateTo;
    }
    if (params.q?.trim()) {
        filters.q = params.q.trim();
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
}

export default async function PatientPlansPage({
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

    if (!clinicId) redirect("/dashboard");

    const allowed = await can("patient-plans", "can_read");
    if (!allowed) redirect("/dashboard");

    const query = await searchParams;
    const filters = parseFilters(query);
    const rows = await getPatientPlans(clinicId, filters);

    return (
        <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50/50">
            <PageHeader
                title="Planos ativos"
                description="Planos de acompanhamento vendidos e período de vigência por paciente."
            />

            <PatientPlansFilters
                key={[
                    query.status ?? "",
                    query.dateFrom ?? "",
                    query.dateTo ?? "",
                ].join("|")}
                defaultStatus={query.status ?? ""}
                defaultDateFrom={query.dateFrom ?? ""}
                defaultDateTo={query.dateTo ?? ""}
                defaultQ={query.q ?? ""}
            />

            <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <PatientPlansTable rows={rows} />
            </div>
        </div>
    );
}
