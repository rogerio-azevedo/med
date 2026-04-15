"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, FileText } from "lucide-react";
import { createProposalAction } from "@/app/actions/proposals";
import { toast } from "sonner";
import { ProposalForm } from "./proposal-form";
import { CreateProposalInput } from "@/lib/validations/proposals";

interface ProposalDialogProps {
    patients: { id: string; name: string }[];
    products: { id: string; name: string; sellingPrice: number; type: string }[];
    paymentTerms: { id: string; name: string; paymentMethod: string; description: string | null }[];
    children?: React.ReactNode;
}

export function ProposalDialog({ patients, products, paymentTerms, children }: ProposalDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function onSubmit(values: CreateProposalInput) {
        setIsPending(true);
        try {
            const result = await createProposalAction(values);

            if (result.success) {
                toast.success("Orçamento gerado com sucesso!");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao processar requisição");
            }
        } catch {
            toast.error("Erro interno. Tente novamente.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 px-6">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Novo Orçamento / Proposta
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden border-none bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-4xl">
                <div className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 pb-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <FileText size={32} />
                        </div>
                        <div>
                            <DialogTitle className="text-3xl font-extrabold tracking-tight text-foreground/90">
                                Novo Orçamento
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium text-lg">
                                Configure os itens e valide os valores para o seu paciente.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-8">
                    <ProposalForm
                        key={isOpen ? "proposal-form-open" : "proposal-form-closed"}
                        patients={patients}
                        products={products}
                        paymentTerms={paymentTerms}
                        onSubmit={onSubmit}
                        isPending={isPending}
                        onCancel={() => setIsOpen(false)}
                        submitLabel="Gerar Proposta"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
