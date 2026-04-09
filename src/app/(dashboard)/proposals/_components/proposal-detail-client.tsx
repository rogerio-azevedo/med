"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { updateProposalAction } from "@/app/actions/proposals";
import { ProposalForm } from "./proposal-form";
import { ProposalPrintButtons } from "./proposal-print-buttons";
import { formatCurrency } from "@/lib/utils";
import type { CreateProposalInput } from "@/lib/validations/proposals";

interface ProposalDetailClientProps {
    proposal: {
        id: string;
        number: number;
        status: string;
        totalAmount: number;
        validUntil: string | null;
        notes: string | null;
        paymentTermId: string | null;
        paymentTermLabel: string | null;
        patientId: string;
        patient: { name: string | null };
        items: Array<{
            id: string;
            productId: string;
            description: string | null;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
        }>;
    };
    patients: { id: string; name: string }[];
    products: { id: string; name: string; sellingPrice: number; type: string }[];
    paymentTerms: { id: string; name: string; paymentMethod: string; description: string | null }[];
}

const statusLabel: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviada",
    won: "Ganha",
    lost: "Perdida",
    cancelled: "Cancelada",
};

export function ProposalDetailClient({
    proposal,
    patients,
    products,
    paymentTerms,
}: ProposalDetailClientProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const initialData: CreateProposalInput = {
        patientId: proposal.patientId,
        validUntil: proposal.validUntil || "",
        notes: proposal.notes || "",
        paymentTermId: proposal.paymentTermId || "",
        paymentTermLabel: proposal.paymentTermLabel || "",
        items: proposal.items.map((item) => ({
            productId: item.productId,
            description: item.description || "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
        })),
    };

    async function handleSubmit(values: CreateProposalInput) {
        setIsPending(true);
        try {
            const result = await updateProposalAction({
                id: proposal.id,
                ...values,
            });

            if (!result.success) {
                toast.error(result.error || "Erro ao atualizar proposta");
                return;
            }

            toast.success("Proposta atualizada com sucesso!");
            router.refresh();
        } catch {
            toast.error("Erro ao atualizar proposta");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="flex flex-col gap-8 p-8">
            <div className="flex flex-col gap-6 rounded-3xl border bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                        <Link
                            href="/proposals"
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para a listagem
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">
                                    Proposta #{String(proposal.number).padStart(4, "0")}
                                </h1>
                                <p className="text-muted-foreground">
                                    Revise dados, observações, forma de pagamento e itens desta proposta.
                                </p>
                            </div>
                        </div>
                    </div>

                    <ProposalPrintButtons proposalId={proposal.id} />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border bg-slate-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</p>
                        <p className="mt-2 text-base font-bold text-slate-900">{proposal.patient?.name || "Sem paciente"}</p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                        <p className="mt-2 text-base font-bold text-slate-900">
                            {statusLabel[proposal.status] || proposal.status}
                        </p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pagamento</p>
                        <p className="mt-2 text-base font-bold text-slate-900">
                            {proposal.paymentTermLabel || "Não definido"}
                        </p>
                    </div>
                    <div className="rounded-2xl border bg-primary/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Valor Atual</p>
                        <p className="mt-2 text-2xl font-black text-primary">{formatCurrency(proposal.totalAmount)}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border bg-white p-8 shadow-sm">
                <ProposalForm
                    patients={patients}
                    products={products}
                    paymentTerms={paymentTerms}
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/proposals")}
                    isPending={isPending}
                    submitLabel="Salvar Alterações"
                />
            </div>
        </div>
    );
}
