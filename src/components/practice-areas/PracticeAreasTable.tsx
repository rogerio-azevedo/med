"use client";

import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Briefcase,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EditPracticeAreaDialog } from "./EditPracticeAreaDialog";
import { DeletePracticeAreaDialog } from "./DeletePracticeAreaDialog";

interface PracticeArea {
    id: string;
    name: string;
    code: string | null;
}

export function PracticeAreasTable({ practiceAreas }: { practiceAreas: PracticeArea[] }) {
    const [selectedPracticeArea, setSelectedPracticeArea] = useState<PracticeArea | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <>
            <div className="rounded-xl border border-muted/20 bg-white/50 backdrop-blur-sm overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-semibold text-foreground/70 h-12">Área de Atuação</TableHead>
                            <TableHead className="font-semibold text-foreground/70 h-12">Código</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/70 h-12">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {practiceAreas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Briefcase size={32} className="opacity-20" />
                                        <p>Nenhuma área de atuação encontrada.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            practiceAreas.map((area) => (
                                <TableRow key={area.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="font-medium flex items-center gap-2 h-14">
                                        <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                            <Briefcase size={16} />
                                        </div>
                                        {area.name}
                                    </TableCell>
                                    <TableCell>
                                        {area.code ? (
                                            <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-muted-foreground/20 text-muted-foreground">
                                                {area.code}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground/30 italic text-xs">Sem código</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted/50 rounded-full transition-all">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px] p-1.5 rounded-xl shadow-xl border-muted/20">
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Ações</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="rounded-lg gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors h-10 px-2"
                                                    onClick={() => {
                                                        setSelectedPracticeArea(area)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="font-medium">Editar</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 bg-muted/20" />
                                                <DropdownMenuItem
                                                    className="rounded-lg gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors h-10 px-2"
                                                    onClick={() => {
                                                        setSelectedPracticeArea(area)
                                                        setIsDeleteDialogOpen(true)
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

            {selectedPracticeArea && (
                <>
                    <EditPracticeAreaDialog
                        practiceArea={selectedPracticeArea}
                        isOpen={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                    />
                    <DeletePracticeAreaDialog
                        practiceArea={selectedPracticeArea}
                        isOpen={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                    />
                </>
            )}
        </>
    );
}
