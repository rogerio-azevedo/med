import { Pill } from "lucide-react";
import {
  getMedicationFilterOptionsAction,
  getMedicationsAction,
} from "@/app/actions/medications";
import { AddMedicationDialog } from "@/components/medications/AddMedicationDialog";
import { MedicationsFilters } from "@/components/medications/MedicationsFilters";
import { MedicationsPagination } from "@/components/medications/MedicationsPagination";
import { MedicationsPageHeader } from "@/components/medications/MedicationsPageHeader";
import { MedicationsTable } from "@/components/medications/MedicationsTable";

function normalizeSearchParam(value?: string) {
  return value?.trim() ? value.trim() : "";
}

function parsePage(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default async function MedicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: "active" | "inactive";
    controlled?: "yes" | "no";
    prescription?: "yes" | "no";
    pharmaceuticalForm?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    query: normalizeSearchParam(params.q),
    page: parsePage(params.page),
    status: params.status,
    controlled: params.controlled,
    prescription: params.prescription,
    pharmaceuticalForm: normalizeSearchParam(params.pharmaceuticalForm),
  } as const;

  const [result, filterOptionsResult] = await Promise.all([
    getMedicationsAction(filters),
    getMedicationFilterOptionsAction(),
  ]);

  const medicationsData = result.success && result.data
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

  const filterOptions = filterOptionsResult.success && filterOptionsResult.data
    ? filterOptionsResult.data
    : {
        pharmaceuticalForms: [],
      };

  return (
    <div className="flex-1 space-y-6 overflow-x-hidden p-6 pt-4">
      <MedicationsPageHeader />
      <div className="grid gap-6">
        <div className="group relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
          <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                <Pill size={20} />
              </div>
              <h3 className="text-lg font-semibold text-foreground/80">Lista de Medicamentos</h3>
              <div className="ml-auto flex items-center gap-3">
                <div className="rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {medicationsData.pagination.total}{" "}
                  {medicationsData.pagination.total === 1 ? "Item" : "Itens"}
                </div>
                <AddMedicationDialog />
              </div>
            </div>

            <div className="space-y-4">
              <MedicationsFilters
                pharmaceuticalForms={filterOptions.pharmaceuticalForms}
                initialValues={{
                  q: filters.query,
                  status: filters.status ?? "",
                  controlled: filters.controlled ?? "",
                  prescription: filters.prescription ?? "",
                  pharmaceuticalForm: filters.pharmaceuticalForm,
                }}
              />

              <MedicationsTable medications={medicationsData.items} />

              <MedicationsPagination
                page={medicationsData.pagination.page}
                totalPages={medicationsData.pagination.totalPages}
                total={medicationsData.pagination.total}
                pageSize={medicationsData.pagination.pageSize}
                searchParams={{
                  q: filters.query || undefined,
                  status: filters.status,
                  controlled: filters.controlled,
                  prescription: filters.prescription,
                  pharmaceuticalForm: filters.pharmaceuticalForm || undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
