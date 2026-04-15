import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WaitingEncounterRow } from "@/db/queries/consultations";

interface WaitingEncountersBannerProps {
    items: WaitingEncounterRow[];
}

export function WaitingEncountersBanner({ items }: WaitingEncountersBannerProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">Pacientes aguardando atendimento</CardTitle>
                    <Badge variant="secondary" className="font-mono">
                        {items.length}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Pré-atendimento concluído na recepção. Abra o prontuário para registrar a consulta.
                </p>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                <ul className="divide-y rounded-lg border bg-card">
                    {items.map((row) => (
                        <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm">
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={
                                        row.encounterKind === "surgery"
                                            ? `/medical-records/${row.patientId}?openSurgery=${row.id}`
                                            : `/medical-records/${row.patientId}?openConsultation=${row.id}`
                                    }
                                    className="font-medium text-primary hover:underline"
                                >
                                    {row.patientName}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                    {row.serviceTypeName ?? "Atendimento"}
                                    {row.healthInsuranceName ? ` · ${row.healthInsuranceName}` : " · Particular"}
                                    {" · há "}
                                    {formatDistanceToNow(new Date(row.startTime), { locale: ptBR, addSuffix: false })}
                                </p>
                            </div>
                            <Link
                                href={
                                    row.encounterKind === "surgery"
                                        ? `/medical-records/${row.patientId}?openSurgery=${row.id}`
                                        : `/medical-records/${row.patientId}?openConsultation=${row.id}`
                                }
                                className="shrink-0 text-xs font-medium text-primary hover:underline"
                            >
                                Atender →
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
