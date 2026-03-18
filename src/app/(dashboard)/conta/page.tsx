import { auth } from "@/auth";
import { db } from "@/db";
import { clinicUsers, clinics, addresses } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { ClinicSettingsForm } from "@/components/conta/ClinicSettingsForm";
import { PasswordSettingsCard } from "@/components/conta/PasswordSettingsCard";

export default async function ContaPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const isAdmin = session.user.role === "admin";
    let clinic: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        cnpj: string | null;
    } | null = null;
    let clinicAddress: typeof addresses.$inferSelect | null = null;

    if (isAdmin) {
        const clinicUser = await db.query.clinicUsers.findFirst({
            where: and(
                eq(clinicUsers.userId, session.user.id),
                eq(clinicUsers.role, "admin"),
                eq(clinicUsers.isActive, true),
            ),
        });

        if (clinicUser) {
            clinic = await db.query.clinics.findFirst({
                where: eq(clinics.id, clinicUser.clinicId),
            }) ?? null;

            if (clinic) {
                clinicAddress = await db.query.addresses.findFirst({
                    where: and(
                        eq(addresses.entityId, clinic.id),
                        eq(addresses.entityType, "clinic"),
                    ),
                }) ?? null;
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Gerencie seu acesso e, se aplicável, as informações da clínica.
                </p>
            </div>

            <PasswordSettingsCard />

            {clinic && (
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
            )}
        </div>
    );
}
