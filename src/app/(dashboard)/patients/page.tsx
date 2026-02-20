import { auth } from "@/auth";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { PatientsTable } from "@/components/patients/PatientsTable";
import { redirect } from "next/navigation";
import { AddPatientDialog } from "@/components/patients/AddPatientDialog";
import { InviteDialog } from "@/components/common/InviteDialog";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PatientsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const patients = await getPatientsByClinic(clinicId);
    const doctors = await getDoctorsSimple(clinicId);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                    <p className="text-muted-foreground">
                        Gerencie o cadastro de seus pacientes.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <InviteDialog
                        clinicId={clinicId}
                        role="patient"
                        trigger={
                            <Button variant="outline">
                                <Share2 className="mr-2 h-4 w-4" />
                                Convidar Paciente
                            </Button>
                        }
                    />
                    <AddPatientDialog doctors={doctors} />
                </div>
            </div>

            <PatientsTable patients={patients} doctors={doctors} />
        </div>
    );
}
