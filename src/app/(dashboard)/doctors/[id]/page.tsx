import { auth } from "@/auth";
import { getDoctorDetails } from "@/db/queries/doctors";
import { redirect, notFound } from "next/navigation";
import { DoctorProfile } from "@/components/doctors/details/DoctorProfile";

interface DoctorDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DoctorDetailsPage({ params }: DoctorDetailsPageProps) {
    const { id } = await params;
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!session?.user || !clinicId) {
        redirect("/login");
    }

    const doctor = await getDoctorDetails(id, clinicId);

    if (!doctor) {
        notFound();
    }

    return (
        <main className="flex-1 w-full bg-muted/20 min-h-[calc(100vh-80px)]">
            <DoctorProfile doctor={doctor} />
        </main>
    );
}
