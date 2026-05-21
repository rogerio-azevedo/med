import { getProceduresAction } from "@/app/actions/procedures";
import { AddProcedureDialog } from "@/components/procedures/AddProcedureDialog";
import { ProceduresTable } from "@/components/procedures/ProceduresTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function ProceduresPage() {
    const allowed = await can("procedures", "can_read");
    if (!allowed) redirect("/dashboard");

    const result = await getProceduresAction();
    const procedures = result.success ? result.data || [] : [];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <PageHeader
                title="Procedimentos"
                description="Gerencie o catálogo de procedimentos para uso futuro no prontuário."
                actions={<AddProcedureDialog />}
            />

            <div className="grid gap-6">
                <ProceduresTable procedures={procedures} />
            </div>
        </div>
    );
}
