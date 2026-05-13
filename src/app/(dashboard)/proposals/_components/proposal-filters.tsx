"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Search } from "lucide-react";

const STATUS_LABELS = {
    draft: "Rascunho",
    sent: "Enviada",
    won: "Ganha",
    lost: "Perdida",
    cancelled: "Cancelada",
} as const;

const PROPOSAL_STATUSES = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[];

function isProposalStatus(value: string): value is keyof typeof STATUS_LABELS {
    return PROPOSAL_STATUSES.includes(value as keyof typeof STATUS_LABELS);
}

export type ProposalFiltersProps = {
    defaultStatus?: string;
    defaultDateFrom?: string;
    defaultDateTo?: string;
    defaultQ?: string;
};

export function ProposalFilters({
    defaultStatus = "",
    defaultDateFrom = "",
    defaultDateTo = "",
    defaultQ = "",
}: ProposalFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [status, setStatus] = useState(defaultStatus);
    const [dateFrom, setDateFrom] = useState(defaultDateFrom);
    const [dateTo, setDateTo] = useState(defaultDateTo);
    const [q, setQ] = useState(defaultQ);

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (status && isProposalStatus(status)) {
            params.set("status", status);
        }
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (q) params.set("q", q);
        
        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    }, [dateFrom, dateTo, pathname, q, router, status]);

    const clearFilters = useCallback(() => {
        setStatus("");
        setDateFrom("");
        setDateTo("");
        setQ("");
        router.push(pathname);
    }, [pathname, router]);

    const statusSelectValue = status && isProposalStatus(status) ? status : "all";

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-end md:gap-4">
            <div className="flex min-w-[180px] flex-col gap-2">
                <Label htmlFor="proposal-filter-status" className="text-xs font-semibold text-muted-foreground">
                    Status
                </Label>
                <Select
                    value={statusSelectValue}
                    onValueChange={(value) => setStatus(value === "all" ? "" : value)}
                >
                    <SelectTrigger id="proposal-filter-status" className="h-10 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {PROPOSAL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex min-w-[140px] flex-col gap-2">
                    <Label htmlFor="proposal-filter-from" className="text-xs font-semibold text-muted-foreground">
                        Data inicial
                    </Label>
                    <Input
                        id="proposal-filter-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-10 rounded-xl border-slate-200"
                    />
                </div>
                <div className="flex min-w-[140px] flex-col gap-2">
                    <Label htmlFor="proposal-filter-to" className="text-xs font-semibold text-muted-foreground">
                        Data final
                    </Label>
                    <Input
                        id="proposal-filter-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-10 rounded-xl border-slate-200"
                    />
                </div>
            </div>

            <div className="flex flex-1 min-w-[240px] flex-col gap-2">
                <Label htmlFor="proposal-filter-search" className="text-xs font-semibold text-muted-foreground">
                    Busca
                </Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        id="proposal-filter-search"
                        placeholder="Paciente ou número..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                        className="h-10 pl-9 rounded-xl border-slate-200"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 md:ml-auto">
                <Button type="button" onClick={applyFilters} className="h-10 rounded-xl font-semibold">
                    Aplicar filtros
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters} className="h-10 gap-2 rounded-xl font-semibold">
                    <X className="h-4 w-4" />
                    Limpar filtros
                </Button>
            </div>
        </div>
    );
}
