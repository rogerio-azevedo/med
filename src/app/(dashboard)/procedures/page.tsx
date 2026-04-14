import { FileBadge2 } from "lucide-react";
import { getProceduresAction } from "@/app/actions/procedures";
import { AddProcedureDialog } from "@/components/procedures/AddProcedureDialog";
import { ProceduresTable } from "@/components/procedures/ProceduresTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function ProceduresPage() {
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
                <div className="group relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
                    <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                                <FileBadge2 size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground/80">
                                Lista de Procedimentos
                            </h3>
                            <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                {procedures.length} {procedures.length === 1 ? "Item" : "Itens"}
                            </div>
                        </div>
                        <ProceduresTable procedures={procedures} />
                    </div>
                </div>
            </div>
        </div>
    );
}
