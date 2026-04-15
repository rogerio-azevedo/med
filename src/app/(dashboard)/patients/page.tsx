import { auth } from "@/auth";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { PatientsPageHeader } from "@/components/patients/PatientsPageHeader";
import { PatientsContent } from "@/components/patients/PatientsContent";

export default async function PatientsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("patients", "can_read");
    if (!allowed) redirect("/dashboard");

    const patients = await getPatientsByClinic(clinicId);
    const doctors = await getDoctorsSimple(clinicId);

    return (
        <>
            <PatientsPageHeader />
            <PatientsContent clinicId={clinicId} patients={patients} doctors={doctors} />
        </>
    );
}
