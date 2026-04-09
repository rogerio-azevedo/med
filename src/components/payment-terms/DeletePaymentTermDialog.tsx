"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deletePaymentTermAction } from "@/app/actions/payment-terms";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeletePaymentTermDialogProps {
    paymentTerm: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeletePaymentTermDialog({
    paymentTerm,
    isOpen,
    onOpenChange,
}: DeletePaymentTermDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        try {
            const result = await deletePaymentTermAction(paymentTerm.id);
            if (!result.success) {
                toast.error(result.error || "Erro ao remover condição de pagamento");
                return;
            }

            toast.success(result.message || "Condição de pagamento removida com sucesso!");
            onOpenChange(false);
        } catch {
            toast.error("Erro ao remover condição de pagamento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remover Condição de Pagamento</DialogTitle>
                    <DialogDescription>
                        A condição <span className="font-semibold">{paymentTerm.name}</span> será inativada se já
                        estiver em uso por propostas anteriores.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
                        {isPending ? "Removendo..." : "Remover"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
