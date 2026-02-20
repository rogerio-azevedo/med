"use client"

import {
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { deleteDoctorAction } from "@/app/actions/doctors"
import { Badge } from "@/components/ui/badge"
import { EditDoctorDialog } from "../EditDoctorDialog"

interface Doctor {
    id: string
    name: string | null
    crm: string | null
    crmState: string | null
    email: string | null
    specialties: { id: string; name: string }[]
}

export function DoctorsTable({ doctors }: { doctors: Doctor[] }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const handleDelete = async () => {
        if (!selectedDoctor) return

        setIsDeleting(true)
        try {
            const result = await deleteDoctorAction(selectedDoctor.id)
            if (result.success) {
                setIsDialogOpen(false)
            } else {
                alert("Erro ao excluir médico")
            }
        } catch (error) {
            alert("Erro ao excluir médico")
        } finally {
            setIsDeleting(false)
            setSelectedDoctor(null)
        }
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Especialidade</TableHead>
                            <TableHead>CRM / Registro</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {doctors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum médico encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            doctors.map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <TableCell className="font-medium">{doctor.name || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {doctor.specialties.length > 0 ? (
                                                doctor.specialties.map((s) => (
                                                    <Badge key={s.id} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                        {s.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground/50">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{doctor.crm ? `${doctor.crm}${doctor.crmState ? ` - ${doctor.crmState}` : ''}` : "-"}</TableCell>
                                    <TableCell>{doctor.email || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedDoctor(doctor)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        setSelectedDoctor(doctor)
                                                        setIsDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remover da Clínica
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

            {selectedDoctor && (
                <EditDoctorDialog
                    doctor={selectedDoctor}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover Médico</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover o médico{" "}
                            <span className="font-semibold">{selectedDoctor?.name}</span> da clínica?
                            O acesso dele será revogado para esta unidade.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Removendo..." : "Remover"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
