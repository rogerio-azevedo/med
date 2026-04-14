"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteScoreItemAction } from "@/app/actions/score-items";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteScoreItemDialogProps {
    scoreItem: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteScoreItemDialog({
    scoreItem,
    isOpen,
    onOpenChange,
}: DeleteScoreItemDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        try {
            const result = await deleteScoreItemAction(scoreItem.id);
            if (!result.success) {
                toast.error(result.error || "Erro ao remover pontuação");
                return;
            }

            toast.success(result.message || "Pontuação inativada com sucesso!");
            onOpenChange(false);
        } catch {
            toast.error("Erro ao remover pontuação");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inativar Pontuação</DialogTitle>
                    <DialogDescription>
                        A pontuação <span className="font-semibold">{scoreItem.name}</span> será marcada como inativa
                        e deixará de aparecer nas listas de seleção futuras.
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
