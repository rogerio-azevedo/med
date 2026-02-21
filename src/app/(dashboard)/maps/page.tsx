import { auth } from "@/auth";
import { getClinicsWithAddress, getDoctorsWithAddress } from "@/db/queries/map";
import { db } from "@/db";
import { specialties } from "@/db/schema";
import { MapComponent } from "./map";
import { redirect } from "next/navigation";

export default async function MapsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/login");
    }

    const [clinicsData, doctorsData, allSpecialties] = await Promise.all([
        getClinicsWithAddress(clinicId),
        getDoctorsWithAddress(clinicId),
        db.select().from(specialties)
    ]);

    return (
        <main className="h-[calc(100vh-80px)] w-full rounded-lg p-3">
            <MapComponent
                clinics={clinicsData}
                doctors={doctorsData}
                specialties={allSpecialties}
            />
        </main>
    );
}
