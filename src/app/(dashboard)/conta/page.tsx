import { auth } from "@/auth";
import { db } from "@/db";
import { clinicUsers, clinics, addresses } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { ClinicSettingsForm } from "@/components/conta/ClinicSettingsForm";

export default async function ContaPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Only admins have access to clinic settings
    if (session.user.role !== "admin") {
        redirect("/dashboard");
    }

    // Find the clinic this admin manages
    const clinicUser = await db.query.clinicUsers.findFirst({
        where: and(
            eq(clinicUsers.userId, session.user.id),
            eq(clinicUsers.role, "admin"),
            eq(clinicUsers.isActive, true),
        ),
    });

    if (!clinicUser) {
        redirect("/dashboard");
    }

    const clinic = await db.query.clinics.findFirst({
        where: eq(clinics.id, clinicUser.clinicId),
    });

    if (!clinic) {
        redirect("/dashboard");
    }

    const clinicAddress = await db.query.addresses.findFirst({
        where: and(
            eq(addresses.entityId, clinic.id),
            eq(addresses.entityType, "clinic"),
        ),
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Conta da Clínica</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Gerencie as informações e o endereço da sua clínica.
                </p>
            </div>

            <ClinicSettingsForm
                clinic={{
                    id: clinic.id,
                    name: clinic.name,
                    email: clinic.email,
                    phone: clinic.phone,
                    cnpj: clinic.cnpj,
                }}
                address={clinicAddress ?? null}
            />
        </div>
    );
}
