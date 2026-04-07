import { auth } from "@/auth";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { AddHospitalDialog } from "@/components/hospitals/AddHospitalDialog";
import { HospitalsTable } from "@/components/hospitals/HospitalsTable";
import { getHospitals } from "@/db/queries/hospitals";

export default async function HospitalsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const hospitals = await getHospitals(clinicId);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                        Hospitais
                    </h2>
                    <p className="mt-1 font-medium text-muted-foreground">
                        Cadastre hospitais da clínica e mantenha seus endereços prontos para o mapa.
                    </p>
                </div>
                <AddHospitalDialog />
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/20 to-orange-400/20 opacity-25 blur transition duration-1000 group-hover:opacity-50" />
                <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 ring-1 ring-rose-500/20">
                            <Building2 size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/80">Hospitais Vinculados</h3>
                        <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {hospitals.length} {hospitals.length === 1 ? "item" : "itens"}
                        </div>
                    </div>

                    <HospitalsTable hospitals={hospitals} />
                </div>
            </div>
        </div>
    );
}
