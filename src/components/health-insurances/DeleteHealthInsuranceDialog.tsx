"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteHealthInsuranceAction } from "@/app/actions/health-insurances";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteHealthInsuranceDialogProps {
    healthInsurance: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteHealthInsuranceDialog({
    healthInsurance,
    isOpen,
    onOpenChange,
}: DeleteHealthInsuranceDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        try {
            const result = await deleteHealthInsuranceAction(healthInsurance.id);
            if (result.success) {
                toast.success(result.message || "Convênio removido com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao remover convênio");
            }
        } catch {
            toast.error("Erro ao remover convênio");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remover Convênio</DialogTitle>
                    <DialogDescription>
                        O convênio <span className="font-semibold">{healthInsurance.name}</span> será inativado se
                        já estiver em uso por clínicas, médicos ou pacientes.
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
