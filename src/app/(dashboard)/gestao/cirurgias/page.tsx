import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { getAllSurgeriesForClinic } from "@/db/queries/surgeries";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { CirurgiasPageHeader } from "@/components/gestao/cirurgias/CirurgiasPageHeader";
import { CirurgiasContent } from "@/components/gestao/cirurgias/CirurgiasContent";

export default async function GestaoCirurgiasPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("surgeries", "can_read");
    if (!allowed) redirect("/dashboard");

    const isDoctorUser = session.user.role === "doctor";
    const doctorId = session.user.doctorId ?? undefined;
    const restrictToSurgeon = isDoctorUser && doctorId ? doctorId : undefined;

    const [surgeries, doctors] = await Promise.all([
        getAllSurgeriesForClinic(clinicId, { surgeonId: restrictToSurgeon }),
        getDoctorsSimple(clinicId),
    ]);

    const showSurgeonFilter = !restrictToSurgeon;

    return (
        <>
            <CirurgiasPageHeader />
            <CirurgiasContent rows={surgeries} doctors={doctors} showSurgeonFilter={showSurgeonFilter} />
        </>
    );
}
