import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddServiceTypeDialog } from "@/components/service-types/AddServiceTypeDialog";
import { ServiceTypesTable } from "@/components/service-types/ServiceTypesTable";
import { getServiceTypes } from "@/db/queries/service-types";

export default async function ServiceTypesPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const serviceTypes = await getServiceTypes(clinicId);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <PageHeader
                title="Tipos de Atendimento"
                description="Gerencie o catálogo usado nos check-ins e nos atendimentos da clínica."
                actions={<AddServiceTypeDialog />}
            />

            <div className="group relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
                <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                            <ClipboardList size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/80">Catálogo de Tipos</h3>
                        <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {serviceTypes.length} {serviceTypes.length === 1 ? "item" : "itens"}
                        </div>
                    </div>

                    <ServiceTypesTable serviceTypes={serviceTypes} />
                </div>
            </div>
        </div>
    );
}
