"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PatientPlanListRow } from "@/db/queries/patient-plans";
import { updatePatientPlanStatusAction } from "@/app/actions/patient-plans";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-700" },
    completed: { label: "Concluído", className: "bg-slate-500/10 text-slate-700" },
    cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

function formatDateBr(iso: string) {
    try {
        return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
    } catch {
        return iso;
    }
}

function daysRemaining(endDate: string | null, status: string): string {
    if (status !== "active") return "—";
    if (!endDate) return "Sem data fim";
    const end = parseISO(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = differenceInCalendarDays(end, today);
    if (d < 0) return `Vencido (${Math.abs(d)} d)`;
    if (d === 0) return "Hoje";
    return `${d} d`;
}

export function PatientPlansTable({ rows }: { rows: PatientPlanListRow[] }) {
    const router = useRouter();

    async function setStatus(id: string, status: "active" | "completed" | "cancelled") {
        const res = await updatePatientPlanStatusAction(id, status);
        if (res.success) {
            toast.success("Status atualizado");
            router.refresh();
        } else {
            toast.error(res.error ?? "Erro ao atualizar");
        }
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                Nenhum plano encontrado com os filtros atuais.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-semibold">Paciente</TableHead>
                        <TableHead className="font-semibold">Plano</TableHead>
                        <TableHead className="font-semibold">Início</TableHead>
                        <TableHead className="font-semibold">Término</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Prazo</TableHead>
                        <TableHead className="w-[72px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r) => (
                        <TableRow key={r.id}>
                            <TableCell className="font-medium">
                                <Link
                                    href={`/medical-records/${r.patientId}`}
                                    className="text-primary hover:underline"
                                >
                                    {r.patientName}
                                </Link>
                            </TableCell>
                            <TableCell>{r.productName}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatDateBr(r.startDate)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {r.endDate ? formatDateBr(r.endDate) : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge
                                    variant="secondary"
                                    className={STATUS_BADGE[r.status]?.className}
                                >
                                    {STATUS_BADGE[r.status]?.label ?? r.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {daysRemaining(r.endDate, r.status)}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {r.status !== "completed" && (
                                            <DropdownMenuItem
                                                onClick={() => setStatus(r.id, "completed")}
                                            >
                                                Marcar concluído
                                            </DropdownMenuItem>
                                        )}
                                        {r.status !== "cancelled" && (
                                            <DropdownMenuItem
                                                onClick={() => setStatus(r.id, "cancelled")}
                                            >
                                                Cancelar plano
                                            </DropdownMenuItem>
                                        )}
                                        {r.status !== "active" && (
                                            <DropdownMenuItem
                                                onClick={() => setStatus(r.id, "active")}
                                            >
                                                Reativar
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
