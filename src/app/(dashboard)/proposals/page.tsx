import { auth } from "@/auth";
import { getProposals, getProposalStats } from "@/db/queries/proposals";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getProducts } from "@/db/queries/products";
import { getActivePaymentTerms } from "@/db/queries/payment-terms";
import { redirect } from "next/navigation";
import { ProposalDialog } from "./_components/proposal-dialog";
import { ProposalsTable } from "./_components/proposals-table";
import { ProposalStats } from "./_components/proposal-stats";
import { FileText, Search, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function ProposalsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const [proposals, stats, patients, products, paymentTerms] = await Promise.all([
        getProposals(clinicId),
        getProposalStats(clinicId),
        getPatientsByClinic(clinicId),
        getProducts(clinicId),
        getActivePaymentTerms(clinicId),
    ]);

    return (
        <div className="flex flex-col gap-10 p-8 min-h-screen bg-slate-50/50">
            <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90">
                            Orçamentos e Propostas
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg">
                            Gerencie o funil de vendas e rastreabilidade da clínica.
                        </p>
                    </div>
                </div>
                <ProposalDialog patients={patients} products={products} paymentTerms={paymentTerms} />
            </header>

            <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest pl-1">
                    <LayoutDashboard size={14} />
                    Visão Geral do Funil
                </div>
                <ProposalStats stats={stats} />
            </div>

            <div className="flex flex-col gap-6">
                <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Buscar por paciente ou número..."
                        className="pl-12 h-12 bg-white border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 focus:border-primary transition-all text-base"
                    />
                </div>

                <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                    <ProposalsTable proposals={proposals} />
                </div>
            </div>
        </div>
    );
}
