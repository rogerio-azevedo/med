"use client";

import { useState } from "react";
import { Building2, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { DeleteHospitalDialog } from "./DeleteHospitalDialog";
import { EditHospitalDialog } from "./EditHospitalDialog";

interface Hospital {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    address?: {
        zipCode: string | null;
        street: string | null;
        number: string | null;
        complement: string | null;
        neighborhood: string | null;
        city: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
}

function formatAddress(address: Hospital["address"]) {
    if (!address) return "Endereço não informado";

    const parts = [address.street, address.number, address.neighborhood, address.city, address.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
}

export function HospitalsTable({ hospitals }: { hospitals: Hospital[] }) {
    const [selected, setSelected] = useState<Hospital | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-muted/20 bg-white/50 shadow-sm backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead>Hospital</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hospitals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                                    Nenhum hospital cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            hospitals.map((hospital) => (
                                <TableRow key={hospital.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <p>{hospital.name}</p>
                                                {hospital.description ? (
                                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                                        {hospital.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span className="line-clamp-2">{formatAddress(hospital.address)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={hospital.isActive ? "default" : "secondary"}>
                                            {hospital.isActive ? "Ativo" : "Inativo"}
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
                                                        setSelected(hospital);
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
                                                        setSelected(hospital);
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
                    <EditHospitalDialog
                        hospital={selected}
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    />
                    <DeleteHospitalDialog
                        hospital={selected}
                        isOpen={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                    />
                </>
            ) : null}
        </>
    );
}
