import { auth } from "@/auth";
import { getClinicsWithAddress, getDoctorsWithAddress, getHospitalsWithAddressForMap } from "@/db/queries/map";
import { db } from "@/db";
import { specialties } from "@/db/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { MapComponent } from "./map";
import { redirect } from "next/navigation";

export default async function MapsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/login");
    }

    const [clinicsData, doctorsData, hospitalsData, allSpecialties] = await Promise.all([
        getClinicsWithAddress(clinicId),
        getDoctorsWithAddress(clinicId),
        getHospitalsWithAddressForMap(clinicId),
        db.select().from(specialties)
    ]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-4 p-3">
            <PageHeader
                title="Mapa de Profissionais"
                description="Visualize clínicas, médicos e hospitais da sua rede em um único mapa."
            />
            <main className="min-h-0 flex-1 rounded-lg">
                <MapComponent
                    clinics={clinicsData}
                    doctors={doctorsData}
                    hospitals={hospitalsData}
                    specialties={allSpecialties}
                />
            </main>
        </div>
    );
}
