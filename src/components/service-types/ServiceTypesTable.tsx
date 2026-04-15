"use client";

import { useState } from "react";
import { ClipboardList, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { DeleteServiceTypeDialog } from "./DeleteServiceTypeDialog";
import { EditServiceTypeDialog } from "./EditServiceTypeDialog";
import { getServiceTypeWorkflowLabel } from "@/lib/service-type-workflows";

interface ServiceType {
    id: string;
    name: string;
    description: string | null;
    workflow: string;
    isActive: boolean;
}

export function ServiceTypesTable({ serviceTypes }: { serviceTypes: ServiceType[] }) {
    const [selected, setSelected] = useState<ServiceType | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-muted/20 bg-white/50 shadow-sm backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Fluxo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {serviceTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                                    Nenhum tipo de atendimento cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            serviceTypes.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                <ClipboardList className="h-4 w-4" />
                                            </div>
                                            <p>{item.name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[420px]">
                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                            {item.description || "Sem descrição adicional"}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{getServiceTypeWorkflowLabel(item.workflow)}</Badge>
                                    </TableCell>
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
                                                    Inativar
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
                    <EditServiceTypeDialog
                        serviceType={selected}
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    />
                    <DeleteServiceTypeDialog
                        serviceType={selected}
                        isOpen={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                    />
                </>
            ) : null}
        </>
    );
}
