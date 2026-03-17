import { auth } from "@/auth";
import { getClinicHealthInsurances, getHealthInsurances } from "@/db/queries/health-insurances";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AddHealthInsuranceDialog } from "@/components/health-insurances/AddHealthInsuranceDialog";
import { ClinicHealthInsuranceManager } from "@/components/health-insurances/ClinicHealthInsuranceManager";
import { HealthInsurancesTable } from "@/components/health-insurances/HealthInsurancesTable";

export default async function HealthInsurancesPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const [allHealthInsurances, clinicHealthInsurances] = await Promise.all([
        getHealthInsurances(),
        getClinicHealthInsurances(clinicId),
    ]);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Convênios Médicos
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">
                        Gerencie o catálogo de convênios e defina quais a clínica aceita.
                    </p>
                </div>
                <AddHealthInsuranceDialog />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 transition duration-1000 group-hover:opacity-50" />
                    <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground/80">Catálogo de Convênios</h3>
                            <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {allHealthInsurances.length} {allHealthInsurances.length === 1 ? "item" : "itens"}
                            </div>
                        </div>

                        <HealthInsurancesTable healthInsurances={allHealthInsurances} />
                    </div>
                </div>

                <div className="rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground/80">Convênios Aceitos pela Clínica</h3>
                            <p className="text-sm text-muted-foreground">
                                Estes convênios ficam disponíveis para vínculo com médicos e validação futura.
                            </p>
                        </div>
                    </div>

                    <ClinicHealthInsuranceManager
                        allHealthInsurances={allHealthInsurances}
                        selectedIds={clinicHealthInsurances.map((item) => item.id)}
                    />
                </div>
            </div>
        </div>
    );
}
