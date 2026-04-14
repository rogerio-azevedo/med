import { LogIn } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AddCheckInDialog } from "@/components/check-ins/AddCheckInDialog";
import { CheckInsTable } from "@/components/check-ins/CheckInsTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { getCheckIns } from "@/db/queries/check-ins";
import { getClinicHealthInsurances } from "@/db/queries/health-insurances";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getActiveScoreItems } from "@/db/queries/score-items";
import { getActiveServiceTypes } from "@/db/queries/service-types";

export default async function CheckInsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const [checkIns, patients, serviceTypes, healthInsurances, scoreItems] = await Promise.all([
        getCheckIns(clinicId),
        getPatientsByClinic(clinicId),
        getActiveServiceTypes(clinicId),
        getClinicHealthInsurances(clinicId),
        getActiveScoreItems(clinicId),
    ]);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <PageHeader
                title="Check-ins"
                description="Registre a chegada do paciente na clínica e classifique o atendimento da recepção."
                actions={
                    <AddCheckInDialog
                    patients={patients.map((item) => ({ id: item.id, name: item.name }))}
                    serviceTypes={serviceTypes.map((item) => ({ id: item.id, name: item.name }))}
                    healthInsurances={healthInsurances.map((item) => ({ id: item.id, name: item.name }))}
                    scoreItems={scoreItems.map((item) => ({
                        id: item.id,
                        name: item.name,
                        score: item.score,
                    }))}
                    />
                }
            />

            <div className="group relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
                <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                            <LogIn size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/80">Fluxo de Chegada</h3>
                        <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {checkIns.length} {checkIns.length === 1 ? "registro" : "registros"}
                        </div>
                    </div>

                    <CheckInsTable checkIns={checkIns} />
                </div>
            </div>
        </div>
    );
}
