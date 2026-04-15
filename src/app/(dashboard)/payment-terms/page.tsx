import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getPaymentTerms } from "@/db/queries/payment-terms";
import { AddPaymentTermDialog } from "@/components/payment-terms/AddPaymentTermDialog";
import { PaymentTermsTable } from "@/components/payment-terms/PaymentTermsTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function PaymentTermsPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("payment-terms", "can_read");
    if (!allowed) redirect("/dashboard");

    const paymentTerms = await getPaymentTerms(clinicId);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <PageHeader
                title="Condições de Pagamento"
                description="Gerencie as formas de pagamento usadas nas propostas da clínica."
                actions={<AddPaymentTermDialog />}
            />

            <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
                <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/80">Catálogo de Pagamentos</h3>
                        <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {paymentTerms.length} {paymentTerms.length === 1 ? "item" : "itens"}
                        </div>
                    </div>

                    <PaymentTermsTable paymentTerms={paymentTerms} />
                </div>
            </div>
        </div>
    );
}
