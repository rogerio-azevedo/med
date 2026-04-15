import { LogIn } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckInsPageHeader } from "@/components/check-ins/CheckInsPageHeader";
import { CheckInsTable } from "@/components/check-ins/CheckInsTable";
import { getCheckIns } from "@/db/queries/check-ins";
import { getClinicHealthInsurances } from "@/db/queries/health-insurances";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getActiveServiceTypes } from "@/db/queries/service-types";

export default async function CheckInsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const [checkIns, patients, serviceTypes, healthInsurances, doctors] = await Promise.all([
        getCheckIns(clinicId),
        getPatientsByClinic(clinicId),
        getActiveServiceTypes(clinicId),
        getClinicHealthInsurances(clinicId),
        getDoctorsSimple(clinicId, { relationshipTypes: ["linked"] }),
    ]);

    const dialogData = {
        patients: patients.map((item) => ({ id: item.id, name: item.name })),
        serviceTypes: serviceTypes.map((item) => ({
            id: item.id,
            name: item.name,
            workflow: item.workflow,
        })),
        healthInsurances: healthInsurances.map((item) => ({ id: item.id, name: item.name })),
        doctors: doctors.map((d) => ({ id: d.id, name: d.name })),
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <CheckInsPageHeader
                title="Check-ins"
                description="Pré-atendimento na recepção: tipo de atendimento, paciente, médico e convênio."
                dialogData={dialogData}
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
