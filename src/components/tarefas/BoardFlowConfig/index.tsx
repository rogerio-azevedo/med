"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GitMerge, Plus, Trash2, Zap } from "lucide-react";
import { createBoardFlowAction } from "@/app/actions/kanban";
import { toast } from "sonner";

const COPY_FIELDS = [
    { id: "description", label: "Descrição" },
    { id: "responsibleId", label: "Responsável" },
    { id: "categoryId", label: "Categoria" },
    { id: "priority", label: "Prioridade" },
    { id: "startDate", label: "Data de início" },
];

export function BoardFlowConfig({ isOpen, onClose, currentBoard, allBoards }: any) {
    const [targetBoardId, setTargetBoardId] = useState<string>("");
    const [copyFields, setCopyFields] = useState<string[]>(["description", "priority"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const otherBoards = allBoards.filter((b: any) => b.id !== currentBoard?.id);

    function toggleField(field: string) {
        setCopyFields(prev =>
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    }

    async function handleCreate() {
        if (!targetBoardId) {
            toast.error("Selecione o quadro de destino");
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createBoardFlowAction({
                sourceBoardId: currentBoard.id,
                targetBoardId,
                triggerColumnType: "DONE",
                copyFields: ["title", ...copyFields],
                isActive: true,
            });
            if (result.success) {
                toast.success("Fluxo configurado! Quando um card chegar em \"Concluído\" aqui, um novo card será criado automaticamente no quadro de destino.");
                onClose();
            } else {
                toast.error(result.error || "Erro ao criar fluxo");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Zap className="size-5 text-primary" />
                            Configurar Fluxo Automático
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quando um card chegar em <strong>Concluído</strong> neste quadro, um novo card será criado automaticamente no quadro de destino.
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Flow visualization */}
                    <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl">
                        <div className="flex flex-col items-center">
                            <span className="text-lg">{currentBoard?.icon}</span>
                            <span className="text-xs font-semibold mt-1 max-w-[80px] text-center truncate">{currentBoard?.name}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2 w-full">
                                <div className="h-px flex-1 bg-emerald-400" />
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Concluído</Badge>
                                <ArrowRight className="size-4 text-primary shrink-0" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg">{allBoards.find((b: any) => b.id === targetBoardId)?.icon || "❓"}</span>
                            <span className="text-xs font-semibold mt-1 max-w-[80px] text-center truncate">
                                {allBoards.find((b: any) => b.id === targetBoardId)?.name || "Destino"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quadro de destino</p>
                        {otherBoards.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Crie pelo menos mais um quadro para configurar fluxos.</p>
                        ) : (
                            <Select onValueChange={setTargetBoardId} value={targetBoardId}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Selecione o quadro de destino..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {otherBoards.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.icon} {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Campos a copiar para o novo card
                            <span className="ml-2 text-muted-foreground/50 font-normal">(título sempre é copiado)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {COPY_FIELDS.map(field => (
                                <label key={field.id} className="flex items-center gap-2 bg-muted/30 p-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={copyFields.includes(field.id)}
                                        onCheckedChange={() => toggleField(field.id)}
                                    />
                                    <span className="text-sm font-medium">{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || !targetBoardId}
                            className="flex-1 rounded-xl gap-2 shadow-sm shadow-primary/20"
                        >
                            <GitMerge className="size-4" />
                            {isSubmitting ? "Salvando..." : "Ativar Fluxo"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
