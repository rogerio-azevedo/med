"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { deletePracticeAreaAction } from "@/app/actions/practice-areas";
import { toast } from "sonner";

interface DeletePracticeAreaDialogProps {
    practiceArea: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeletePracticeAreaDialog({ practiceArea, isOpen, onOpenChange }: DeletePracticeAreaDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function onDelete() {
        setIsPending(true);
        try {
            const result = await deletePracticeAreaAction(practiceArea.id);
            if (result.success) {
                toast.success("Área de atuação removida com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao remover área de atuação");
            }
        } catch (error) {
            toast.error("Erro ao remover área de atuação");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                <div className="bg-destructive/10 p-6 pb-4 border-b border-destructive/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-destructive/10 rounded-2xl text-destructive shadow-inner">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-destructive">Remover Área de Atuação</DialogTitle>
                            <DialogDescription className="text-destructive/80 font-medium text-sm">
                                Esta ação não pode ser desfeita.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Você tem certeza que deseja remover a área de atuação <span className="font-bold text-foreground">"{practiceArea.name}"</span>?
                        Isso pode afetar médicos que possuem esta área vinculada.
                    </p>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-muted/50 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isPending}
                        onClick={onDelete}
                        className="min-w-[120px] shadow-xl shadow-destructive/10 transition-all active:scale-95 text-white"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removendo...</>
                        ) : (
                            <><Trash2 className="mr-2 h-4 w-4" /> Confirmar Exclusão</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
