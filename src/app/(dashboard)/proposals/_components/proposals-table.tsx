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
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    MoreHorizontal, 
    CheckCircle2, 
    XCircle, 
    RotateCcw, 
    History,
    Calendar,
    User
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { updateProposalStatusAction } from "@/app/actions/proposals";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Proposal {
    id: string;
    number: number;
    status: string;
    totalAmount: number;
    createdAt: Date;
    validUntil: string | null;
    patient: { name: string };
    createdBy: { name: string | null };
    wonAt?: Date | null;
    wonById?: string | null;
    cancelledAt?: Date | null;
    cancelledById?: string | null;
}

interface ProposalsTableProps {
    proposals: any[];
}

export function ProposalsTable({ proposals }: ProposalsTableProps) {
    const router = useRouter();

    async function onUpdateStatus(id: string, status: string) {
        try {
            const result = await updateProposalStatusAction(id, status);
            if (result.success) {
                const messages: Record<string, string> = {
                    won: "Proposta marcada como GANHA! 🎉",
                    lost: "Proposta marcada como PERDIDA.",
                    cancelled: "Proposta cancelada.",
                    draft: "Proposta reaberta.",
                };
                toast.success(messages[status] || "Status atualizado.");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Erro ao atualizar status");
        }
    }

    const statusConfig: Record<string, { label: string; color: string }> = {
        draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-600" },
        sent: { label: "Enviada", color: "bg-blue-500/10 text-blue-600" },
        won: { label: "Ganha", color: "bg-emerald-500/10 text-emerald-600" },
        lost: { label: "Perdida", color: "bg-rose-500/10 text-rose-600" },
        cancelled: { label: "Cancelada", color: "bg-orange-500/10 text-orange-600" },
    };

    if (proposals.length === 0) {
        return (
            <div className="p-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground gap-5 bg-muted/15">
                <div className="p-6 bg-muted/20 rounded-full text-muted-foreground/40">
                    <History size={48} />
                </div>
                <div className="text-center max-w-sm">
                    <p className="font-bold text-lg text-foreground/80">Nenhum orçamento ainda.</p>
                    <p className="text-sm font-medium">Gere uma nova proposta para começar a monitorar suas oportunidades.</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="rounded-3xl border bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-0 h-14">
                            <TableHead className="font-bold text-slate-900 pl-8"># Número</TableHead>
                            <TableHead className="font-bold text-slate-900">Paciente</TableHead>
                            <TableHead className="font-bold text-slate-900">Data / Validade</TableHead>
                            <TableHead className="font-bold text-slate-900 text-right">Valor Total</TableHead>
                            <TableHead className="font-bold text-slate-900 text-center">Status</TableHead>
                            <TableHead className="font-bold text-slate-900">Rastreabilidade</TableHead>
                            <TableHead className="w-[80px] pr-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposals.map((proposal) => (
                            <TableRow key={proposal.id} className="hover:bg-slate-50/30 transition-all border-b border-slate-100 last:border-0 h-20">
                                <TableCell className="font-bold text-slate-600 pl-8">
                                    #{String(proposal.number).padStart(4, '0')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{proposal.patient?.name}</span>
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Cliente</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-xs font-semibold">
                                                {format(new Date(proposal.createdAt), "dd/MM/yyyy")}
                                            </span>
                                        </div>
                                        {proposal.validUntil && (
                                            <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-full w-fit">
                                                Até {format(new Date(proposal.validUntil), "dd/MM/yyyy")}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-lg font-black text-slate-900">
                                        {formatCurrency(proposal.totalAmount)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        variant="outline"
                                        className={`font-bold uppercase tracking-wider text-[10px] rounded-full px-3 py-1 border-none ${statusConfig[proposal.status].color}`}
                                    >
                                        {statusConfig[proposal.status].label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 cursor-help">
                                                    <User size={16} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="p-3 bg-slate-900 text-white border-none rounded-xl">
                                                <div className="space-y-2 text-xs">
                                                    <p><span className="font-bold text-slate-400">CRIADO POR:</span> {proposal.createdBy?.name || "N/A"}</p>
                                                    {proposal.status === "won" && (
                                                        <p className="text-emerald-400"><span className="font-bold text-slate-400">FECHADO EM:</span> {proposal.wonAt ? format(new Date(proposal.wonAt), "dd/MM 'às' HH:mm") : "N/A"}</p>
                                                    )}
                                                    {proposal.status === "cancelled" && (
                                                        <p className="text-rose-400"><span className="font-bold text-slate-400">CANCELADO EM:</span> {proposal.cancelledAt ? format(new Date(proposal.cancelledAt), "dd/MM 'às' HH:mm") : "N/A"}</p>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-500">Por: {proposal.createdBy?.name?.split(' ')[0]}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">Autor da Proposta</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="pr-8">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-2xl">
                                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Ações do Funil</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-slate-100" />
                                            
                                            {proposal.status !== "won" && (
                                                <DropdownMenuItem 
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-bold"
                                                    onClick={() => onUpdateStatus(proposal.id, "won")}
                                                >
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Marcar como Ganho
                                                </DropdownMenuItem>
                                            )}

                                            {proposal.status !== "lost" && proposal.status !== "won" && (
                                                <DropdownMenuItem 
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-bold"
                                                    onClick={() => onUpdateStatus(proposal.id, "lost")}
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                    Marcar como Perdido
                                                </DropdownMenuItem>
                                            )}

                                            {(proposal.status === "won" || proposal.status === "lost" || proposal.status === "cancelled") && (
                                                <DropdownMenuItem 
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 font-bold"
                                                    onClick={() => onUpdateStatus(proposal.id, "draft")}
                                                >
                                                    <RotateCcw className="h-5 w-5" />
                                                    Reabrir / Revisar
                                                </DropdownMenuItem>
                                            )}

                                            {proposal.status !== "cancelled" && (
                                                <>
                                                    <DropdownMenuSeparator className="bg-slate-100" />
                                                    <DropdownMenuItem 
                                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 focus:bg-slate-50 font-bold"
                                                        onClick={() => onUpdateStatus(proposal.id, "cancelled")}
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                        Cancelar Proposta
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    );
}
