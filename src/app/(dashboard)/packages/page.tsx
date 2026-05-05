import { auth } from "@/auth";
import { getProducts } from "@/db/queries/products";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { PackageDialog } from "./_components/package-dialog";
import { PackagesTable } from "./_components/packages-table";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function PackagesPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("packages", "can_read");
    if (!allowed) redirect("/dashboard");

    const products = await getProducts(clinicId);

    return (
        <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50/50">
            <PageHeader
                title="Planos e Pacotes"
                description="Gerencie seus produtos, serviços e planos de acompanhamento."
                actions={<PackageDialog />}
            />

            <div className="flex flex-col gap-6">
                <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                    <PackagesTable products={products} />
                </div>
            </div>
        </div>
    );
}
