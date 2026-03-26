"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle2, RefreshCcw, User, GitBranch } from "lucide-react";
import { moveCardAction } from "@/app/actions/kanban";
import { toast } from "sonner";

// Returns date urgency class (same logic as Sindico Pro)
function getDateColor(dateStr: string | null | undefined) {
    if (!dateStr) return "text-muted-foreground";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate > today) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (taskDate.getTime() === today.getTime()) return "bg-amber-100 text-amber-700 border border-amber-200";
    return "bg-red-100 text-red-700 border border-red-200";
}

const priorityColors: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 border-red-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    LOW: "bg-blue-100 text-blue-700 border-blue-200",
};

const priorityLabels: Record<string, string> = {
    HIGH: "Alta",
    MEDIUM: "Média",
    LOW: "Baixa",
};

export function KanbanCard({ card, categories, onClick, doneColumnId, isInDoneColumn }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: "Card", card },
    });

    const style = { transform: CSS.Translate.toString(transform), transition };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-40 bg-muted/40 border-2 border-dashed border-primary/30 rounded-xl min-h-[120px] transition-all"
            />
        );
    }

    const category = card.category || categories?.find((c: any) => c.id === card.categoryId);
    const dateColor = getDateColor(card.startDate);

    async function handleMarkAsDone(e: React.MouseEvent) {
        e.stopPropagation(); // don't open details modal
        if (!doneColumnId) return;
        const result = await moveCardAction({
            cardId: card.id,
            targetColumnId: doneColumnId,
            position: 1,
        });
        if (result.error) toast.error("Erro ao concluir tarefa");
        else toast.success("Tarefa marcada como concluída!");
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="group cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-md transition-all shadow-sm border-border/50 relative"
        >
            <CardHeader className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {/* Indicators row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {card.isRecurringTask && (
                                <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                                    <RefreshCcw className="size-2.5" />
                                    Recorrente
                                </span>
                            )}
                            {card.sourceCardId && (
                                <span className="flex items-center gap-1 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md font-medium">
                                    <GitBranch className="size-2.5" />
                                    Fluxo
                                </span>
                            )}
                        </div>
                        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                            {card.title}
                        </CardTitle>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn("text-[10px] uppercase font-bold px-1.5 shrink-0", priorityColors[card.priority])}
                    >
                        {priorityLabels[card.priority] || card.priority}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-0 space-y-2.5">
                {card.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                )}

                {category && (
                    <span
                        className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: category.color || "#6b7280" }}
                    >
                        {category.name}
                    </span>
                )}

                <div className="flex items-center justify-between gap-2 pt-0.5">
                    {/* Date with urgency color - shows startDate or endDate */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {card.startDate ? (
                            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", dateColor)}>
                                <Calendar className="size-3" />
                                {new Date(card.startDate).toLocaleDateString("pt-BR")}
                            </span>
                        ) : card.endDate ? (
                            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", getDateColor(card.endDate))}>
                                <Calendar className="size-3" />
                                Até {new Date(card.endDate).toLocaleDateString("pt-BR")}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                <Calendar className="size-3" />
                                Sem data
                            </span>
                        )}
                        {card.startDate && card.endDate && (
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted/60 text-muted-foreground">
                                até {new Date(card.endDate).toLocaleDateString("pt-BR")}
                            </span>
                        )}
                    </div>


                    <div className="flex items-center gap-1.5">
                        {/* Responsible */}
                        {card.responsible?.user?.name && (
                            <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-full border border-border/50">
                                <User className="size-2.5 text-primary" />
                                <span className="text-[10px] font-medium text-foreground/80 max-w-[60px] truncate">
                                    {card.responsible.user.name.split(" ")[0]}
                                </span>
                            </div>
                        )}

                        {/* Quick mark as done button (not shown if already in DONE column) */}
                        {doneColumnId && !isInDoneColumn && (
                            <button
                                onClick={handleMarkAsDone}
                                title="Marcar como concluído"
                                className="transition-opacity rounded-md bg-emerald-500 hover:bg-emerald-600 p-0.5 text-white"
                            >
                                <CheckCircle2 className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
