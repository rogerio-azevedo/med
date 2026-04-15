"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface CheckInRow {
    id: string;
    createdAt: Date;
    patient: { id: string; name: string };
    serviceType: { id: string; name: string };
    healthInsurance: { id: string | null; name: string | null } | null;
    doctor: { id: string | null; name: string | null };
    createdBy: { clinicUserId: string; userId: string; name: string | null };
    notes: string | null;
}

export function CheckInsTable({ checkIns }: { checkIns: CheckInRow[] }) {
    return (
        <div className="overflow-hidden rounded-xl border border-muted/20 bg-white/50 shadow-sm backdrop-blur-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Convênio</TableHead>
                        <TableHead>Recepção</TableHead>
                        <TableHead>Observações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {checkIns.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                                Nenhum check-in registrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        checkIns.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="whitespace-nowrap text-sm">
                                    {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", {
                                        locale: ptBR,
                                    })}
                                </TableCell>
                                <TableCell className="font-medium">{item.patient.name}</TableCell>
                                <TableCell>{item.serviceType.name}</TableCell>
                                <TableCell className="text-sm">
                                    {item.doctor?.name ? `Dr(a). ${item.doctor.name}` : "—"}
                                </TableCell>
                                <TableCell>{item.healthInsurance?.name || "Particular / Sem convênio"}</TableCell>
                                <TableCell>{item.createdBy.name || "Usuário sem nome"}</TableCell>
                                <TableCell className="max-w-[280px]">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {item.notes || "Sem observações"}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
