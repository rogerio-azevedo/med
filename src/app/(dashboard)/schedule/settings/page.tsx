import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { DoctorScheduleConfig } from "@/components/schedule/DoctorScheduleConfig";

export const metadata = {
    title: "Configurar Agenda | Med",
    description: "Configuração de disponibilidade de horários dos médicos",
};

export default async function ScheduleSettingsPage() {
    const session = await auth();
    if (!session?.user?.clinicId) redirect("/login");

    const role = session.user.role;
    if (role !== "admin" && role !== "doctor") {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                    Você não tem permissão para acessar esta página.
                </div>
            </div>
        );
    }

    const clinicId = session.user.clinicId;
    let doctors = await getDoctorsSimple(clinicId);

    // Se for médico, pode ver e editar APENAS a própria agenda
    let defaultDoctorId: string | undefined = undefined;
    if (role === "doctor") {
        const { db } = await import("@/db");
        const { doctors: docsTable } = await import("@/db/schema/medical");
        const { eq } = await import("drizzle-orm");
        const myDoc = await db.select().from(docsTable).where(eq(docsTable.userId, session.user.id as string)).limit(1);

        if (myDoc.length > 0) {
            const myDoctorProfile = doctors.find((d) => d.id === myDoc[0].id);
            if (myDoctorProfile) {
                doctors = [myDoctorProfile];
                defaultDoctorId = myDoctorProfile.id;
            } else {
                return (
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="text-center text-muted-foreground">
                            Perfil de médico não encontrado para o seu usuário nesta clínica.
                        </div>
                    </div>
                );
            }
        } else {
            return (
                <div className="flex h-full items-center justify-center p-8">
                    <div className="text-center text-muted-foreground">
                        Perfil de médico não encontrado para o seu usuário.
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Disponibilidade</h2>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os horários e turnos de atendimento.
                    </p>
                </div>
            </div>

            <DoctorScheduleConfig doctors={doctors} defaultDoctorId={defaultDoctorId} />
        </div>
    );
}
