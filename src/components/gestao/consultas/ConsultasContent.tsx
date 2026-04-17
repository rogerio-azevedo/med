"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Search } from "lucide-react";
import type { ClinicConsultationListRow } from "@/db/queries/consultations";
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

const CONSULTATION_STATUSES = ["waiting", "in_progress", "finished", "cancelled"] as const;

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

interface ConsultasContentProps {
    rows: ClinicConsultationListRow[];
    doctors: { id: string; name: string | null }[];
    showDoctorFilter: boolean;
}

export function ConsultasContent({ rows, doctors, showDoctorFilter }: ConsultasContentProps) {
    const [patientSearch, setPatientSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [doctorFilter, setDoctorFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const filtered = useMemo(() => {
        const from = dayStart(dateFrom);
        const to = dayEnd(dateTo);

        return rows.filter((r) => {
            if (statusFilter && r.status !== statusFilter) return false;
            if (doctorFilter && r.doctorId !== doctorFilter) return false;
            if (patientSearch && !matchesNormalizedSearch(r.patientName, patientSearch)) return false;
            const t = new Date(r.startTime);
            if (from && t < from) return false;
            if (to && t > to) return false;
            return true;
        });
    }, [rows, statusFilter, doctorFilter, patientSearch, dateFrom, dateTo]);

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
                            {CONSULTATION_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s === "waiting" && "Aguardando"}
                                    {s === "in_progress" && "Em andamento"}
                                    {s === "finished" && "Concluído"}
                                    {s === "cancelled" && "Cancelado"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {showDoctorFilter && (
                        <Select
                            value={doctorFilter || "__all_docs__"}
                            onValueChange={(v) => setDoctorFilter(v === "__all_docs__" ? "" : v)}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Médico" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all_docs__">Todos os médicos</SelectItem>
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
                            <TableHead>Médico</TableHead>
                            <TableHead>Convênio</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Nenhuma consulta encontrada com os filtros atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.patientName}</TableCell>
                                    <TableCell>{r.doctorName ?? "—"}</TableCell>
                                    <TableCell>{r.healthInsuranceName ?? "—"}</TableCell>
                                    <TableCell>{r.serviceTypeName ?? "—"}</TableCell>
                                    <TableCell>
                                        <EncounterStatusBadge status={r.status} />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {format(new Date(r.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
