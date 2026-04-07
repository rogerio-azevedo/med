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
import { PlusCircle, Package } from "lucide-react";
import { createProductAction, updateProductAction } from "@/app/actions/products";
import { toast } from "sonner";
import { PackageForm } from "./package-form";
import { CreateProductInput } from "@/lib/validations/products";

interface PackageDialogProps {
    initialData?: Partial<CreateProductInput> & { id: string };
    children?: React.ReactNode;
}

export function PackageDialog({ initialData, children }: PackageDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function onSubmit(values: CreateProductInput) {
        setIsPending(true);
        try {
            const result = initialData?.id
                ? await updateProductAction(initialData.id, values)
                : await createProductAction(values);

            if (result.success) {
                toast.success(
                    initialData?.id
                        ? "Produto atualizado com sucesso!"
                        : "Produto criado com sucesso!"
                );
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao processar requisição");
            }
        } catch (error) {
            toast.error("Erro interno. Tente novamente.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Novo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <Package size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                                {initialData?.id ? "Editar Produto" : "Novo Produto"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Configure os detalhes do seu plano ou serviço.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <PackageForm
                        initialData={initialData}
                        onSubmit={onSubmit}
                        isPending={isPending}
                        onCancel={() => setIsOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
