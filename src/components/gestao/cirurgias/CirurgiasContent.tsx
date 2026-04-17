"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Search } from "lucide-react";
import type { ClinicSurgeryListRow } from "@/db/queries/surgeries";
import { matchesNormalizedSearch } from "@/lib/search-normalize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EncounterStatusBadge } from "@/components/gestao/shared/EncounterStatusBadge";

const SURGERY_STATUSES = ["scheduled", "waiting", "in_progress", "finished", "cancelled"] as const;

function parseSurgeryDate(value: string | Date | null): Date | null {
    if (value == null) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Data efetiva para filtro: data da cirurgia ou dia de criação do registro. */
function effectiveDay(row: ClinicSurgeryListRow): Date {
    const sd = parseSurgeryDate(row.surgeryDate);
    if (sd) {
        return new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), 12, 0, 0, 0);
    }
    const c = new Date(row.createdAt);
    return new Date(c.getFullYear(), c.getMonth(), c.getDate(), 12, 0, 0, 0);
}

function dayStart(isoDate: string): Date | null {
    if (!isoDate) return null;
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayEnd(isoDate: string): Date | null {
    if (!isoDate) return null;
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function displaySurgeryDate(row: ClinicSurgeryListRow): string {
    const sd = parseSurgeryDate(row.surgeryDate);
    if (sd) return format(sd, "dd/MM/yyyy", { locale: ptBR });
    return format(new Date(row.createdAt), "dd/MM/yyyy", { locale: ptBR });
}

interface CirurgiasContentProps {
    rows: ClinicSurgeryListRow[];
    doctors: { id: string; name: string | null }[];
    showSurgeonFilter: boolean;
}

export function CirurgiasContent({ rows, doctors, showSurgeonFilter }: CirurgiasContentProps) {
    const [patientSearch, setPatientSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [surgeonFilter, setSurgeonFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const filtered = useMemo(() => {
        const from = dayStart(dateFrom);
        const to = dayEnd(dateTo);

        return rows.filter((r) => {
            if (statusFilter && r.status !== statusFilter) return false;
            if (surgeonFilter && r.surgeonId !== surgeonFilter) return false;
            if (patientSearch && !matchesNormalizedSearch(r.patientName, patientSearch)) return false;
            const eff = effectiveDay(r);
            if (from && eff < from) return false;
            if (to && eff > to) return false;
            return true;
        });
    }, [rows, statusFilter, surgeonFilter, patientSearch, dateFrom, dateTo]);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="relative w-full min-w-[200px] max-w-sm flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="Buscar por paciente..."
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Todos os status</SelectItem>
                            {SURGERY_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s === "scheduled" && "Agendada"}
                                    {s === "waiting" && "Aguardando"}
                                    {s === "in_progress" && "Em andamento"}
                                    {s === "finished" && "Concluído"}
                                    {s === "cancelled" && "Cancelado"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {showSurgeonFilter && (
                        <Select
                            value={surgeonFilter || "__all_sur__"}
                            onValueChange={(v) => setSurgeonFilter(v === "__all_sur__" ? "" : v)}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Cirurgião" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all_sur__">Todos os cirurgiões</SelectItem>
                                {doctors.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.name ?? "Sem nome"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-[160px]"
                        title="Data inicial"
                    />
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-[160px]"
                        title="Data final"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Cirurgião</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Nenhuma cirurgia encontrada com os filtros atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.patientName}</TableCell>
                                    <TableCell>{r.surgeonName ?? "—"}</TableCell>
                                    <TableCell>{r.hospitalName ?? "—"}</TableCell>
                                    <TableCell>{r.serviceTypeName ?? "—"}</TableCell>
                                    <TableCell>
                                        <EncounterStatusBadge status={r.status} />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {displaySurgeryDate(r)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/medical-records/${r.patientId}`}>
                                                Prontuário
                                                <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
