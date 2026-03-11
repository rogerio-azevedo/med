"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { deleteBoardAction } from "@/app/actions/kanban";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function DeleteBoardModal({ isOpen, onClose, onDeleted, boardToDelete, allBoards }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [targetBoardId, setTargetBoardId] = useState("");

    const availableBoards = allBoards.filter((b: any) => b.id !== boardToDelete?.id);

    async function handleDelete() {
        if (!boardToDelete) return;
        if (availableBoards.length > 0 && !targetBoardId) {
            toast.error("Por favor, selecione um quadro de destino para as tarefas.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (availableBoards.length === 0) {
                 toast.error("Para excluir, você precisa ter outro quadro para transferir as tarefas.");
                 return;
            }

            const result = await deleteBoardAction(boardToDelete.id, targetBoardId);
            if (result.success) {
                toast.success("Quadro excluído e tarefas transferidas!");
                onDeleted(boardToDelete.id, targetBoardId);
                onClose();
            } else {
                toast.error(result.error || "Erro ao excluir quadro");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // Reset select when modal opens
    if (!isOpen && targetBoardId) {
        setTargetBoardId("");
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-destructive">
                        <AlertCircle className="size-5" />
                        Excluir Quadro
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        Você está prestes a excluir o quadro <strong>{boardToDelete?.name}</strong>. Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {availableBoards.length > 0 ? (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Transferir tarefas para:</Label>
                            <Select value={targetBoardId} onValueChange={setTargetBoardId}>
                                <SelectTrigger className="w-full rounded-xl">
                                    <SelectValue placeholder="Selecione o quadro de destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBoards.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.icon && <span className="mr-2">{b.icon}</span>}
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Todas as tarefas atuais serão movidas para a primeira coluna do quadro selecionado.
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                            <strong>Atenção:</strong> Você precisa criar outro quadro antes de excluir este, para que as tarefas possam ser transferidas.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isSubmitting || (availableBoards.length > 0 && !targetBoardId) || availableBoards.length === 0}
                        onClick={handleDelete}
                        className="rounded-xl px-6"
                    >
                        {isSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
