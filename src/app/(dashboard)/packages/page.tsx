import { auth } from "@/auth";
import { getProducts } from "@/db/queries/products";
import { redirect } from "next/navigation";
import { PackageDialog } from "./_components/package-dialog";
import { PackagesTable } from "./_components/packages-table";
import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function PackagesPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const products = await getProducts(clinicId);

    return (
        <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50/50">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                        <Package size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90">
                            Planos e Pacotes
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            Gerencie seus produtos, serviços e planos de acompanhamento.
                        </p>
                    </div>
                </div>
                <PackageDialog />
            </header>

            <div className="flex flex-col gap-6">
                {/* 
                    Aqui poderíamos adicionar filtros por tipo, mas para o MVP 
                    a busca textual e a tabela completa já atendem bem.
                */}
                <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou descrição..."
                        className="pl-9 bg-white border-muted shadow-sm hover:border-primary/30 transition-colors"
                    />
                </div>

                <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                    <PackagesTable products={products} />
                </div>
            </div>
        </div>
    );
}
