import { auth } from "@/auth";
import { getDoctorsListAction } from "@/app/actions/doctors";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { DoctorsPageHeader } from "@/components/doctors/DoctorsPageHeader";
import { DoctorsPageContent } from "@/components/doctors/DoctorsPageContent";

function normalizeSearchParam(value?: string) {
    return value?.trim() ? value.trim() : "";
}

function parsePage(value?: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default async function DoctorsPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string;
        page?: string;
        hideUnassociated?: string;
    }>;
}) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("doctors", "can_read");
    if (!allowed) redirect("/dashboard");

    const params = await searchParams;
    const filters = {
        q: normalizeSearchParam(params.q),
        page: parsePage(params.page),
        hideUnassociated: params.hideUnassociated !== "false",
    } as const;

    const result = await getDoctorsListAction(clinicId, {
        query: filters.q || undefined,
        page: filters.page,
        hideUnassociated: filters.hideUnassociated,
    });

    const doctorsData =
        result.success && result.data
            ? result.data
            : {
                  items: [],
                  pagination: {
                      page: 1,
                      pageSize: 25,
                      total: 0,
                      totalPages: 1,
                      hasPreviousPage: false,
                      hasNextPage: false,
                  },
              };

    return (
        <>
            <DoctorsPageHeader />
            <DoctorsPageContent
                clinicId={clinicId}
                doctors={doctorsData.items}
                pagination={doctorsData.pagination}
                filters={{
                    q: filters.q,
                    hideUnassociated: filters.hideUnassociated,
                }}
            />
        </>
    );
}
