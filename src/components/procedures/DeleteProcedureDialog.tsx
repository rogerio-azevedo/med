"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProcedureAction } from "@/app/actions/procedures";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteProcedureDialogProps {
    procedure: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteProcedureDialog({ procedure, isOpen, onOpenChange }: DeleteProcedureDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function onDelete() {
        setIsPending(true);
        try {
            const result = await deleteProcedureAction(procedure.id);
            if (result.success) {
                toast.success("Procedimento removido com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao remover procedimento");
            }
        } catch {
            toast.error("Erro ao remover procedimento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-none bg-white p-0 shadow-2xl sm:max-w-[420px]">
                <div className="border-b border-destructive/20 bg-destructive/10 p-6 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-destructive/10 p-3 text-destructive shadow-inner">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-destructive">
                                Remover Procedimento
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium text-destructive/80">
                                Esta ação não pode ser desfeita.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Você tem certeza que deseja remover o procedimento <span className="font-bold text-foreground">&quot;{procedure.name}&quot;</span>?
                    </p>
                </div>

                <DialogFooter className="flex items-center justify-between border-t bg-muted/20 p-6 sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="transition-all hover:bg-muted/50"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isPending}
                        onClick={onDelete}
                        className="min-w-[120px] text-white shadow-xl shadow-destructive/10 transition-all active:scale-95"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removendo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" /> Confirmar Exclusão
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
