"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, ShieldCheck } from "lucide-react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteHealthInsuranceDialog } from "./DeleteHealthInsuranceDialog";
import { EditHealthInsuranceDialog } from "./EditHealthInsuranceDialog";

interface HealthInsurance {
    id: string;
    name: string;
    code: string | null;
    ansCode: string | null;
    notes: string | null;
    isActive: boolean;
}

export function HealthInsurancesTable({
    healthInsurances,
}: {
    healthInsurances: HealthInsurance[];
}) {
    const [selected, setSelected] = useState<HealthInsurance | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    return (
        <>
            <div className="rounded-xl border border-muted/20 bg-white/50 backdrop-blur-sm overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead>Convênio</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>ANS</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {healthInsurances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                                    Nenhum convênio cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            healthInsurances.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <p>{item.name}</p>
                                                {item.notes ? (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {item.notes}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.code || <span className="text-muted-foreground/40">-</span>}</TableCell>
                                    <TableCell>{item.ansCode || <span className="text-muted-foreground/40">-</span>}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? "default" : "secondary"}>
                                            {item.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelected(item);
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        setSelected(item);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remover
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selected ? (
                <>
                    <EditHealthInsuranceDialog
                        healthInsurance={selected}
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    />
                    <DeleteHealthInsuranceDialog
                        healthInsurance={selected}
                        isOpen={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                    />
                </>
            ) : null}
        </>
    );
}
