import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteDialog } from "@/components/common/InviteDialog";
import { AddDoctorDialog } from "@/components/doctors/AddDoctorDialog";
import { DoctorsTable } from "@/components/doctors/DoctorsTable";
import { DoctorsFilters } from "@/components/doctors/DoctorsFilters";
import { DoctorsPagination } from "@/components/doctors/DoctorsPagination";
import { type Doctor } from "@/types/doctor";

export type DoctorsListPagination = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

interface DoctorsPageContentProps {
    clinicId: string;
    doctors: Doctor[];
    pagination: DoctorsListPagination;
    filters: {
        q: string;
        hideUnassociated: boolean;
    };
}

export function DoctorsPageContent({
    clinicId,
    doctors,
    pagination,
    filters,
}: DoctorsPageContentProps) {
    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <DoctorsFilters
                    key={`${filters.q}|${filters.hideUnassociated}`}
                    initialValues={{
                        q: filters.q,
                        hideUnassociated: filters.hideUnassociated,
                    }}
                />

                <div className="flex items-center gap-2">
                    <InviteDialog
                        clinicId={clinicId}
                        role="doctor"
                        trigger={
                            <Button variant="outline">
                                <Share2 className="mr-2 h-4 w-4" />
                                Convidar Médico
                            </Button>
                        }
                    />
                    <AddDoctorDialog />
                </div>
            </div>

            <DoctorsTable
                doctors={doctors}
                hideUnassociatedDoctors={filters.hideUnassociated}
            />

            <DoctorsPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                pageSize={pagination.pageSize}
                searchParams={{
                    q: filters.q || undefined,
                    hideUnassociated: filters.hideUnassociated ? undefined : "false",
                }}
            />
        </div>
    );
}
