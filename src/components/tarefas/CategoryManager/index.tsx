"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Tag } from "lucide-react";
import { createCategoryAction, deleteCategoryAction } from "@/app/actions/kanban";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

const PRESET_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function CategoryManager({ isOpen, onClose, categories, onUpdate }: any) {
    const [name, setName] = useState("");
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; categoryId: string | null; categoryName: string }>({
        isOpen: false,
        categoryId: null,
        categoryName: ""
    });

    async function handleCreate() {
        if (!name.trim()) return;
        setIsSubmitting(true);
        try {
            const result = await createCategoryAction({ name: name.trim(), color });
            if (result.success) {
                toast.success("Categoria criada!");
                setName("");
                onUpdate(result.data);
            } else {
                toast.error(result.error || "Erro ao criar categoria");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    function requestDelete(cat: any) {
        setConfirmState({ isOpen: true, categoryId: cat.id, categoryName: cat.name });
    }

    async function executeDelete() {
        const id = confirmState.categoryId;
        if (!id) return;

        const result = await deleteCategoryAction(id);
        if (result.success) {
            toast.success("Categoria excluída");
            onUpdate(null, id);
        } else {
            toast.error(result.error || "Erro ao excluir");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 gap-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Tag className="size-5 text-primary" />
                        Gerenciar Categorias
                    </DialogTitle>
                </DialogHeader>

                {/* Create new */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nova categoria</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nome da categoria..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/40"
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                        />
                        <Button
                            size="icon"
                            onClick={handleCreate}
                            disabled={isSubmitting || !name.trim()}
                            className="rounded-xl shrink-0 shadow-sm shadow-primary/20"
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                    backgroundColor: c,
                                    borderColor: color === c ? "white" : "transparent",
                                    outline: color === c ? `2px solid ${c}` : "none",
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Categorias existentes ({categories.length})
                    </p>
                    {categories.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6 italic">Nenhuma categoria criada.</p>
                    )}
                    {categories.map((cat: any) => (
                        <div key={cat.id} className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded-xl group">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#6b7280" }} />
                                <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => requestDelete(cat)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button variant="outline" onClick={onClose} className="rounded-xl w-full">
                    Fechar
                </Button>
            </DialogContent>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title="Excluir Categoria"
                description={`Tem certeza que deseja excluir a categoria "${confirmState.categoryName}"? O efeito será removido de todas as tarefas associadas.`}
                confirmText="Excluir"
                variant="destructive"
            />
        </Dialog>
    );
}
