import { auth } from "@/auth";
import { getDoctorsByClinic } from "@/db/queries/doctors";
import { DoctorsTable } from "@/components/doctors/DoctorsTable";
import { redirect } from "next/navigation";
import { AddDoctorDialog } from "@/components/doctors/AddDoctorDialog";
import { InviteDialog } from "@/components/common/InviteDialog";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DoctorsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const doctors = await getDoctorsByClinic(clinicId);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Médicos</h1>
                    <p className="text-muted-foreground">
                        Gerencie a equipe médica da sua clínica.
                    </p>
                </div>
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

            <DoctorsTable doctors={doctors} />
        </div>
    );
}
