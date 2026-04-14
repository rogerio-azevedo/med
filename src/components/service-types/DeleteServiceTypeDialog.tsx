"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteServiceTypeAction } from "@/app/actions/service-types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteServiceTypeDialogProps {
    serviceType: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteServiceTypeDialog({
    serviceType,
    isOpen,
    onOpenChange,
}: DeleteServiceTypeDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        try {
            const result = await deleteServiceTypeAction(serviceType.id);
            if (!result.success) {
                toast.error(result.error || "Erro ao remover tipo de atendimento");
                return;
            }

            toast.success(result.message || "Tipo de atendimento inativado com sucesso!");
            onOpenChange(false);
        } catch {
            toast.error("Erro ao remover tipo de atendimento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inativar Tipo de Atendimento</DialogTitle>
                    <DialogDescription>
                        O tipo <span className="font-semibold">{serviceType.name}</span> será marcado como inativo e
                        deixará de aparecer nos novos check-ins.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
                        {isPending ? "Inativando..." : "Inativar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
