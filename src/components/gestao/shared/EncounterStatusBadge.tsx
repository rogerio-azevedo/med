import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
    waiting: "Aguardando",
    in_progress: "Em andamento",
    finished: "Concluído",
    cancelled: "Cancelado",
    scheduled: "Agendada",
};

const STATUS_CLASS: Record<string, string> = {
    waiting: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
    in_progress: "border-blue-500/40 bg-blue-500/10 text-blue-950 dark:text-blue-100",
    finished: "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
    cancelled: "border-muted-foreground/30 bg-muted text-muted-foreground",
    scheduled: "border-violet-500/40 bg-violet-500/10 text-violet-950 dark:text-violet-100",
};

interface EncounterStatusBadgeProps {
    status: string;
}

export function EncounterStatusBadge({ status }: EncounterStatusBadgeProps) {
    const label = STATUS_LABELS[status] ?? status;
    const cls = STATUS_CLASS[status] ?? "border-border bg-muted/50 text-foreground";

    return (
        <Badge variant="outline" className={cn("font-normal", cls)}>
            {label}
        </Badge>
    );
}
