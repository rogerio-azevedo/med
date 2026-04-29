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
import { X } from "lucide-react";

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
};

export function ProposalFilters({
    defaultStatus = "",
    defaultDateFrom = "",
    defaultDateTo = "",
}: ProposalFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [status, setStatus] = useState(defaultStatus);
    const [dateFrom, setDateFrom] = useState(defaultDateFrom);
    const [dateTo, setDateTo] = useState(defaultDateTo);

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (status && isProposalStatus(status)) {
            params.set("status", status);
        }
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        const q = params.toString();
        router.push(q ? `${pathname}?${q}` : pathname);
    }, [dateFrom, dateTo, pathname, router, status]);

    const clearFilters = useCallback(() => {
        setStatus("");
        setDateFrom("");
        setDateTo("");
        router.push(pathname);
    }, [pathname, router]);

    const statusSelectValue = status && isProposalStatus(status) ? status : "all";

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end md:gap-6">
            <div className="flex min-w-[180px] flex-col gap-2">
                <Label htmlFor="proposal-filter-status" className="text-xs font-semibold text-muted-foreground">
                    Status
                </Label>
                <Select
                    value={statusSelectValue}
                    onValueChange={(value) => setStatus(value === "all" ? "" : value)}
                >
                    <SelectTrigger id="proposal-filter-status" className="h-11 rounded-xl border-slate-200 bg-white">
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
                        className="h-11 rounded-xl border-slate-200"
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
                        className="h-11 rounded-xl border-slate-200"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 md:ml-auto">
                <Button type="button" onClick={applyFilters} className="h-11 rounded-xl font-semibold">
                    Aplicar filtros
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters} className="h-11 gap-2 rounded-xl font-semibold">
                    <X className="h-4 w-4" />
                    Limpar filtros
                </Button>
            </div>
        </div>
    );
}
