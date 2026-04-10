"use client";

import { Images, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
    lab_exam: "Exame laboratorial",
    imaging: "Imagem",
    clinical_photo: "Foto clínica",
    report: "Laudo / relatório",
    other: "Outro",
};

interface FileGroupCardProps {
    title: string;
    category: string;
    groupCount: number;
    referenceDate: string | null;
    uploaderName?: string | null;
    compact?: boolean;
    onClick?: () => void;
    canDelete?: boolean;
    onDeleted?: () => void;
    groupId?: string;
}

export function FileGroupCard({
    title,
    category,
    groupCount,
    referenceDate,
    uploaderName,
    compact,
    onClick,
    canDelete,
    onDeleted,
    groupId,
}: FileGroupCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent opening the carousel
        if (!groupId) return;
        if (!confirm("Excluir todas as fotos deste grupo permanentemente?")) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/files/group/${groupId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("delete failed");
            toast.success("Grupo de fotos removido");
            onDeleted?.();
        } catch {
            toast.error("Falha ao excluir o grupo de fotos");
            setIsDeleting(false);
        }
    };

    const refLabel =
        referenceDate &&
        format(new Date(`${referenceDate}T12:00:00`), "dd/MM/yyyy", { locale: ptBR });

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left flex items-start rounded-lg border bg-card text-sm",
                "hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer",
                compact ? "gap-2.5 p-2.5 md:gap-3 md:p-3" : "gap-3 p-3"
            )}
        >
            {/* Ícone de galeria com badge de contagem */}
            <div className="relative shrink-0">
                <div
                    className={cn(
                        "rounded-md bg-primary/10 text-primary",
                        compact ? "p-2 md:p-2.5" : "p-2"
                    )}
                >
                    <Images className={compact ? "size-4 md:size-5" : "h-5 w-5"} />
                </div>
                <span
                    className={cn(
                        "absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none",
                        compact ? "size-4" : "size-5"
                    )}
                >
                    {groupCount}
                </span>
            </div>

            {/* Informações */}
            <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium text-foreground", compact && "text-sm")}>
                    {title}
                </p>
                <p className={cn("text-muted-foreground", compact ? "text-xs leading-snug" : "text-xs")}>
                    {CATEGORY_LABELS[category] ?? category}
                    {refLabel && ` · Ref. ${refLabel}`}
                </p>
                <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-xs")}>
                    {groupCount} {groupCount === 1 ? "foto" : "fotos"} · clique para visualizar
                </p>
                {uploaderName ? (
                    <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-xs")}>
                        Por {uploaderName}
                    </p>
                ) : null}
            </div>

            {/* Ações adicionais (Delete) */}
            {canDelete ? (
                <div className="shrink-0 pl-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("text-destructive hover:text-destructive", compact && "size-8 md:size-9")}
                        onClick={handleDelete}
                        title="Excluir grupo"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <span className="h-4 w-4 rounded-full border-2 border-destructive border-t-transparent animate-spin" />
                        ) : (
                            <Trash2 className={compact ? "size-4" : "h-4 w-4"} />
                        )}
                    </Button>
                </div>
            ) : null}
        </button>
    );
}
