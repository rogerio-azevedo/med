import { auth } from "@/auth";
import { getDoctorsByClinic } from "@/db/queries/doctors";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { DoctorsPageHeader } from "@/components/doctors/DoctorsPageHeader";
import { DoctorsPageContent } from "@/components/doctors/DoctorsPageContent";

export default async function DoctorsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("doctors", "can_read");
    if (!allowed) redirect("/dashboard");

    const doctors = await getDoctorsByClinic(clinicId);

    return (
        <>
            <DoctorsPageHeader />
            <DoctorsPageContent clinicId={clinicId} doctors={doctors} />
        </>
    );
}
