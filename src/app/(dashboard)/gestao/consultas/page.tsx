import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { getAllConsultationsForClinic } from "@/db/queries/consultations";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { ConsultasPageHeader } from "@/components/gestao/consultas/ConsultasPageHeader";
import { ConsultasContent } from "@/components/gestao/consultas/ConsultasContent";

export default async function GestaoConsultasPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("consultations", "can_read");
    if (!allowed) redirect("/dashboard");

    const isDoctorUser = session.user.role === "doctor";
    const doctorId = session.user.doctorId ?? undefined;
    const restrictToDoctor = isDoctorUser && doctorId ? doctorId : undefined;

    const [consultations, doctors] = await Promise.all([
        getAllConsultationsForClinic(clinicId, { doctorId: restrictToDoctor }),
        getDoctorsSimple(clinicId),
    ]);

    const showDoctorFilter = !restrictToDoctor;

    return (
        <>
            <ConsultasPageHeader />
            <ConsultasContent rows={consultations} doctors={doctors} showDoctorFilter={showDoctorFilter} />
        </>
    );
}
