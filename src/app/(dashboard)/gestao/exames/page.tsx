import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { getAllExamsForClinic } from "@/db/queries/exams";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { ExamesPageHeader } from "@/components/gestao/exames/ExamesPageHeader";
import { ExamesContent } from "@/components/gestao/exames/ExamesContent";

export default async function GestaoExamesPage() {
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

    const [exams, doctors] = await Promise.all([
        getAllExamsForClinic(clinicId, { doctorId: restrictToDoctor }),
        getDoctorsSimple(clinicId),
    ]);

    const showDoctorFilter = !restrictToDoctor;

    return (
        <>
            <ExamesPageHeader />
            <ExamesContent rows={exams} doctors={doctors} showDoctorFilter={showDoctorFilter} />
        </>
    );
}
