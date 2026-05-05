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
    all: "Todos",
    active: "Ativo",
    completed: "Concluído",
    cancelled: "Cancelado",
} as const;

const LISTING_STATUSES = ["all", "active", "completed", "cancelled"] as const;

export type PatientPlansFiltersProps = {
    defaultStatus?: string;
    defaultDateFrom?: string;
    defaultDateTo?: string;
    defaultQ?: string;
};

export function PatientPlansFilters({
    defaultStatus = "",
    defaultDateFrom = "",
    defaultDateTo = "",
    defaultQ = "",
}: PatientPlansFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [status, setStatus] = useState(defaultStatus);
    const [dateFrom, setDateFrom] = useState(defaultDateFrom);
    const [dateTo, setDateTo] = useState(defaultDateTo);
    const [q, setQ] = useState(defaultQ);

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (status && LISTING_STATUSES.includes(status as (typeof LISTING_STATUSES)[number]) && status !== "all") {
            params.set("status", status);
        }
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (q.trim()) params.set("q", q.trim());

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

    const statusSelectValue =
        status && LISTING_STATUSES.includes(status as (typeof LISTING_STATUSES)[number])
            ? status
            : "all";

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-end md:gap-4">
            <div className="flex min-w-[180px] flex-col gap-2">
                <Label htmlFor="pp-status" className="text-xs font-semibold text-muted-foreground">
                    Status
                </Label>
                <Select
                    value={statusSelectValue}
                    onValueChange={(v) => setStatus(v === "all" ? "" : v)}
                >
                    <SelectTrigger id="pp-status" className="bg-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {LISTING_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex min-w-[140px] flex-col gap-2">
                <Label htmlFor="pp-from" className="text-xs font-semibold text-muted-foreground">
                    Início a partir de
                </Label>
                <Input
                    id="pp-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-white"
                />
            </div>

            <div className="flex min-w-[140px] flex-col gap-2">
                <Label htmlFor="pp-to" className="text-xs font-semibold text-muted-foreground">
                    Início até
                </Label>
                <Input
                    id="pp-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-white"
                />
            </div>

            <div className="relative flex min-w-[200px] flex-1 flex-col gap-2">
                <Label htmlFor="pp-q" className="text-xs font-semibold text-muted-foreground">
                    Busca
                </Label>
                <Search className="pointer-events-none absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
                <Input
                    id="pp-q"
                    placeholder="Paciente ou plano..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="bg-white pl-9"
                />
            </div>

            <div className="flex gap-2">
                <Button type="button" onClick={applyFilters}>
                    Filtrar
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Limpar
                </Button>
            </div>
        </div>
    );
}
