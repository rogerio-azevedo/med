"use client";

import { FileBadge2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { DeleteProcedureDialog } from "./DeleteProcedureDialog";
import { EditProcedureDialog } from "./EditProcedureDialog";

interface Procedure {
    id: string;
    type: "general" | "consultation" | "exam" | "therapy" | "hospitalization";
    tussCode: string | null;
    name: string;
    description: string | null;
    purpose: string | null;
}

const procedureTypeLabel: Record<Procedure["type"], string> = {
    general: "GERAL",
    consultation: "CONSULTA",
    exam: "EXAME",
    therapy: "TERAPIA",
    hospitalization: "INTERNAÇÃO",
};

export function ProceduresTable({ procedures }: { procedures: Procedure[] }) {
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-muted/20 bg-white/50 shadow-sm backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="h-12 font-semibold text-foreground/70">Tipo</TableHead>
                            <TableHead className="h-12 font-semibold text-foreground/70">Código TUSS</TableHead>
                            <TableHead className="h-12 font-semibold text-foreground/70">Nome</TableHead>
                            <TableHead className="h-12 font-semibold text-foreground/70">Descrição</TableHead>
                            <TableHead className="h-12 font-semibold text-foreground/70">Finalidade</TableHead>
                            <TableHead className="h-12 text-right font-semibold text-foreground/70">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {procedures.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileBadge2 size={32} className="opacity-20" />
                                        <p>Nenhum procedimento encontrado.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            procedures.map((procedure) => (
                                <TableRow key={procedure.id} className="transition-colors hover:bg-primary/[0.02]">
                                    <TableCell className="h-14 text-xs font-semibold text-muted-foreground">
                                        {procedureTypeLabel[procedure.type]}
                                    </TableCell>
                                    <TableCell className="h-14 font-mono text-xs uppercase text-muted-foreground">
                                        {procedure.tussCode || <span className="text-muted-foreground/30 italic">Sem código</span>}
                                    </TableCell>
                                    <TableCell className="h-14 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-primary/5 p-2 text-primary">
                                                <FileBadge2 size={16} />
                                            </div>
                                            <span>{procedure.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[340px] text-sm text-muted-foreground">
                                        {procedure.description ? (
                                            <span className="line-clamp-2">{procedure.description}</span>
                                        ) : (
                                            <span className="text-muted-foreground/30 italic">Sem descrição</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {procedure.purpose || <span className="text-muted-foreground/30 italic">Sem finalidade</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 rounded-full p-0 transition-all hover:bg-muted/50">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-muted/20 p-1.5 shadow-xl">
                                                <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Ações
                                                </DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="h-10 cursor-pointer gap-2 rounded-lg px-2 transition-colors focus:bg-primary/5 focus:text-primary"
                                                    onClick={() => {
                                                        setSelectedProcedure(procedure);
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="font-medium">Editar</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 bg-muted/20" />
                                                <DropdownMenuItem
                                                    className="h-10 cursor-pointer gap-2 rounded-lg px-2 text-destructive transition-colors focus:bg-destructive/10 focus:text-destructive"
                                                    onClick={() => {
                                                        setSelectedProcedure(procedure);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="font-medium">Remover</span>
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

            {selectedProcedure && (
                <>
                    <EditProcedureDialog
                        procedure={selectedProcedure}
                        isOpen={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                    />
                    <DeleteProcedureDialog
                        procedure={selectedProcedure}
                        isOpen={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                    />
                </>
            )}
        </>
    );
}
