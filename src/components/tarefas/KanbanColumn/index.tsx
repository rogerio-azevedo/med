"use client";

import { useState } from "react";
import { useSortable, verticalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "../KanbanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Lock, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteColumnAction, updateColumnAction } from "@/app/actions/kanban";
import { toast } from "sonner";

interface KanbanColumnProps {
    column: any;
    cards: any[];
    categories: any[];
    onAddCard?: () => void;
    onCardClick?: (card: any) => void;
    isFixed?: boolean;
    doneColumnId?: string | null;
}

export function KanbanColumn({ column, cards, categories, onAddCard, onCardClick, isFixed, doneColumnId }: KanbanColumnProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: { type: "Column", column },
        disabled: isFixed,
    });

    // Dedicated droppable zone for cards (always present, even when column is empty)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `col-drop-${column.id}`,
        data: { type: "ColumnDrop", column },
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(column.name);

    async function handleRename() {
        if (!editName.trim() || editName === column.name) {
            setIsEditing(false);
            setEditName(column.name);
            return;
        }

        const result = await updateColumnAction(column.id, { name: editName });
        if (result.success) {
            toast.success("Coluna renomeada");
        } else {
            toast.error("Erro ao renomear");
            setEditName(column.name);
        }
        setIsEditing(false);
    }

    async function handleDelete() {
        if (cards.length > 0) {
            toast.error("A coluna precisa estar vazia para ser excluída.");
            return;
        }

        const result = await deleteColumnAction(column.id);
        if (result.success) {
            toast.success("Coluna excluída");
        } else {
            toast.error("Erro ao excluir coluna");
        }
    }

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const isDone = column.columnType === "DONE";
    const isToDo = column.columnType === "TO_DO";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "w-80 h-full rounded-2xl flex flex-col border shadow-sm",
                isDragging ? "opacity-50 scale-[0.98]" : "",
                isDone
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/30"
                    : isToDo
                        ? "bg-slate-50/70 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-700/30"
                        : "bg-muted/30 border-border/40"
            )}
        >
            {/* Header */}
            <div
                {...(!isFixed ? attributes : {})}
                {...(!isFixed ? listeners : {})}
                className={cn(
                    "p-4 flex items-center justify-between border-b",
                    isDone ? "border-emerald-200/40 dark:border-emerald-800/20" : "border-border/20",
                    !isFixed && "cursor-grab active:cursor-grabbing"
                )}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isFixed && (
                        <Lock className={cn("size-3 shrink-0", isDone ? "text-emerald-500" : "text-slate-400")} />
                    )}

                    {isEditing ? (
                        <Input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") {
                                    setIsEditing(false);
                                    setEditName(column.name);
                                }
                            }}
                            className="h-7 text-sm font-semibold px-2 py-0 border-primary rounded"
                        />
                    ) : (
                        <h3
                            onDoubleClick={() => !isFixed && setIsEditing(true)}
                            className={cn(
                                "font-semibold text-sm uppercase tracking-wider truncate",
                                isDone ? "text-emerald-600 dark:text-emerald-400" :
                                    isToDo ? "text-slate-500 dark:text-slate-400" :
                                        "text-muted-foreground/80 hover:text-foreground cursor-text"
                            )}
                            title="Duplo clique para renomear"
                        >
                            {column.name}
                        </h3>
                    )}

                    <span className="bg-background shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border border-border/50 text-foreground/70">
                        {cards.length}
                    </span>
                </div>
                {!isFixed && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" onClick={onAddCard} className="size-8 rounded-full">
                            <Plus className="size-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-full">
                                    <MoreHorizontal className="size-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer rounded-lg">
                                    <Pencil className="size-4" />
                                    Renomear
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    disabled={cards.length > 0}
                                    className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg"
                                >
                                    <Trash2 className="size-4" />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Cards */}
            <div
                ref={setDropRef}
                className={cn(
                    "flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin transition-colors",
                    isOver && "bg-primary/5 rounded-xl"
                )}
            >
                <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            categories={categories}
                            onClick={() => onCardClick?.(card)}
                            doneColumnId={doneColumnId}
                            isInDoneColumn={column.columnType === "DONE"}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Add card footer */}
            <div className="p-3 pt-0">
                <Button
                    variant="ghost"
                    onClick={onAddCard}
                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground font-medium h-9 gap-2 rounded-xl"
                >
                    <Plus className="size-3.5" />
                    Adicionar cartão
                </Button>
            </div>
        </div>
    );
}
