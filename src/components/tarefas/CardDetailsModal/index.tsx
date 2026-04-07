"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Trash2, MessageSquare, Send, Settings2, CalendarCheck, CalendarClock, History } from "lucide-react";
import { createCommentAction, deleteCardAction, getCardCommentsAction } from "@/app/actions/kanban";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

interface CardComment {
    id: string;
    content: string;
    createdAt: string | Date | null;
    user?: {
        name?: string | null;
    } | null;
}

interface CardDetails {
    id: string;
    title: string;
    description?: string | null;
    priority: "HIGH" | "MEDIUM" | "LOW" | string;
    createdAt?: string | null;
    updatedAt?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    hour?: string | null;
    sourceCardId?: string | null;
    comments?: CardComment[];
}

interface CardDetailsModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    card: CardDetails | null;
    onEdit: (card: CardDetails) => void;
    onDeleted?: (cardId: string) => void;
}

function formatDate(value: string | Date | null | undefined) {
    if (!value) return null;
    return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string | Date | null | undefined) {
    if (!value) return null;
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function CardDetailsModal({ isOpen, onClose, card, onEdit, onDeleted }: CardDetailsModalProps) {
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localComments, setLocalComments] = useState<CardComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const initialComments = card?.comments;

    useEffect(() => {
        let isActive = true;

        async function loadComments() {
            if (!isOpen || !card?.id) {
                if (isActive) {
                    setLocalComments([]);
                }
                return;
            }

            if (initialComments && isActive) {
                setLocalComments(initialComments);
            }

            setIsLoadingComments(true);

            try {
                const result = await getCardCommentsAction(card.id);
                if (isActive) {
                    if (result.success) {
                        setLocalComments(result.data ?? []);
                    } else {
                        setLocalComments(initialComments ?? []);
                    }
                }
            } finally {
                if (isActive) {
                    setIsLoadingComments(false);
                }
            }
        }

        loadComments();

        return () => {
            isActive = false;
        };
    }, [card?.id, initialComments, isOpen]);

    if (!card) return null;

    const currentCard = card;

    async function handleAddComment() {
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            const result = await createCommentAction({
                kanbanCardId: currentCard.id,
                content: comment,
            });
            if (result.success) {
                setComment("");
                toast.success("Comentário adicionado");
                // Refresh comments from DB so we get the user info joined
                const refreshed = await getCardCommentsAction(currentCard.id);
                if (refreshed.success) {
                    setLocalComments(refreshed.data ?? []);
                }
            } else {
                toast.error(result.error || "Erro ao adicionar comentário");
            }
        } catch {
            toast.error("Erro ao adicionar comentário");
        } finally {
            setIsSubmitting(false);
        }
    }

    function requestDelete() {
        setIsDeleteConfirmOpen(true);
    }

    async function executeDelete() {
        try {
            const result = await deleteCardAction(currentCard.id);
            if (result.success) {
                toast.success("Tarefa excluída");
                if (onDeleted) {
                    onDeleted(currentCard.id);
                } else {
                    onClose(false);
                }
            }
        } catch {
            toast.error("Erro ao excluir tarefa");
        }
    }

    const priorityColors: Record<string, string> = {
        HIGH: "bg-red-100 text-red-700",
        MEDIUM: "bg-amber-100 text-amber-700",
        LOW: "bg-blue-100 text-blue-700",
    };

    const priorityLabels: Record<string, string> = {
        HIGH: "Alta",
        MEDIUM: "Média",
        LOW: "Baixa",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary/5 p-6 pb-4">
                    <DialogHeader className="flex-row items-start justify-between space-y-0">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", priorityColors[currentCard.priority])}>
                                    {priorityLabels[currentCard.priority] || currentCard.priority}
                                </Badge>
                                {currentCard.sourceCardId && (
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border-indigo-100">
                                        Vindo de outro board
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-2xl font-bold text-foreground">
                                {currentCard.title}
                            </DialogTitle>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(currentCard)} className="rounded-full hover:bg-background">
                                <Settings2 className="size-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={requestDelete} className="rounded-full hover:bg-red-50 hover:text-red-500">
                                <Trash2 className="size-5" />
                            </Button>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-4 space-y-6">
                    {/* Dates row */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                            <Calendar className="size-3.5 shrink-0" />
                            <span className="truncate text-xs">
                                <span className="font-medium text-foreground/70">Criação: </span>
                                {formatDateTime(currentCard.createdAt) ?? "—"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                            <History className="size-3.5 shrink-0" />
                            <span className="truncate text-xs">
                                <span className="font-medium text-foreground/70">Movimentação: </span>
                                {formatDateTime(currentCard.updatedAt) ?? "—"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                            <CalendarClock className="size-3.5 shrink-0" />
                            <span className="truncate text-xs">
                                <span className="font-medium text-foreground/70">Execução: </span>
                                {formatDate(currentCard.startDate) ?? "Sem data"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                            <CalendarCheck className="size-3.5 shrink-0" />
                            <span className="truncate text-xs">
                                <span className="font-medium text-foreground/70">Conclusão: </span>
                                {formatDate(currentCard.endDate) ?? "Sem data"}
                            </span>
                        </div>
                        {currentCard.hour && (
                            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                                <Clock className="size-3.5 shrink-0" />
                                <span className="text-xs">
                                    <span className="font-medium text-foreground/70">Hora: </span>
                                    {currentCard.hour}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                            <MessageSquare className="size-3.5 shrink-0" />
                            <span className="text-xs">{localComments.length} comentário{localComments.length !== 1 ? "s" : ""}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Descrição</h4>
                        <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap bg-muted/20 p-4 rounded-2xl">
                            {currentCard.description || <span className="italic text-muted-foreground">Sem descrição detalhada.</span>}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comentários</h4>

                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                            {isLoadingComments ? (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">
                                    Carregando comentários...
                                </p>
                            ) : localComments.length > 0 ? (
                                localComments.map((c) => (
                                    <div key={c.id} className="flex gap-3">
                                        <Avatar className="size-8">
                                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                                {c.user?.name?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-muted/30 flex-1 p-3 rounded-2xl">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold">{c.user?.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatDateTime(c.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum comentário ainda.</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Textarea
                                placeholder="Escreva um comentário..."
                                className="min-h-[60px] rounded-2xl resize-none text-sm bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/40"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <Button
                                size="icon"
                                className="self-end rounded-2xl min-h-[60px] w-12 shadow-sm shadow-primary/20"
                                onClick={handleAddComment}
                                disabled={isSubmitting || !comment.trim()}
                            >
                                <Send className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeDelete}
                title="Excluir Tarefa"
                description={`Tem certeza que deseja excluir "${card.title}"? Esta ação não pode ser desfeita e todo o progresso será perdido.`}
                confirmText="Excluir"
                variant="destructive"
            />
        </Dialog>
    );
}
