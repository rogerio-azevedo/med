"use client"

import {
    MoreHorizontal,
    Pencil,
    Trash2,
    QrCode,
    KeyRound,
    Link2,
    Eye,
    AlertCircle,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import {
    associateDoctorToClinicAction,
    deleteDoctorAction,
    updateDoctorRelationshipTypeAction,
} from "@/app/actions/doctors"
import { Badge } from "@/components/ui/badge"
import { EditDoctorDialog } from "../EditDoctorDialog"
import { DoctorDetailsDialog } from "../DoctorDetailsDialog"
import { DoctorQRCodeDialog } from "../DoctorQRCodeDialog"
import { SetDoctorPasswordDialog } from "../SetDoctorPasswordDialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { type Doctor } from "@/types/doctor"

export function DoctorsTable({
    doctors,
    hideUnassociatedDoctors,
}: {
    doctors: Doctor[];
    hideUnassociatedDoctors: boolean;
}) {
    const router = useRouter()
    const linkedDoctors = doctors.filter(
        (doctor) => doctor.isAssociated && doctor.relationshipType === "linked"
    )
    const partnerDoctors = doctors.filter(
        (doctor) => doctor.isAssociated && doctor.relationshipType === "partner"
    )
    const unassociatedDoctors = doctors.filter((doctor) => !doctor.isAssociated)
    const groupedDoctors = [
        { key: "linked", title: "Médicos Vinculados", doctors: linkedDoctors },
        { key: "partner", title: "Médicos Parceiros", doctors: partnerDoctors },
        ...(!hideUnassociatedDoctors
            ? [{ key: "unassociated", title: "Médicos Sem Vínculo", doctors: unassociatedDoctors }]
            : []),
    ].filter((group) => group.doctors.length > 0)

    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [missingInfoDoctor, setMissingInfoDoctor] = useState<Doctor | null>(null)
    const [relationshipType, setRelationshipType] = useState<"linked" | "partner">("linked")
    const [isSavingRelationship, setIsSavingRelationship] = useState(false)
    const [isAssociating, setIsAssociating] = useState(false)

    const getMissingInfo = (doctor: Doctor) => {
        const missing: string[] = []
        if (!doctor.phone) missing.push("Telefone")
        
        // Se for um email fake gerado pelo nosso importador, consideramos pendente
        if (!doctor.email || doctor.email.endsWith("@mail.com")) missing.push("E-mail")
            
        if (!doctor.address || !doctor.address.street || !doctor.address.zipCode) {
            missing.push("Endereço")
        }
        return missing
    }

    const normalizedSelectedDoctor = selectedDoctor
        ? {
            ...selectedDoctor,
            address:
                selectedDoctor.address && typeof selectedDoctor.address === "object"
                    ? {
                        ...selectedDoctor.address,
                        latitude: selectedDoctor.address.latitude ?? null,
                        longitude: selectedDoctor.address.longitude ?? null,
                    }
                    : null,
            relationshipType: selectedDoctor.relationshipType ?? "linked",
        }
        : null

    const handleUnlinkDoctor = async () => {
        if (!selectedDoctor) return

        setIsDeleting(true)
        try {
            const result = await deleteDoctorAction(selectedDoctor.id)
            if (result.success) {
                toast.success("Médico desassociado da clínica com sucesso")
                setIsLinkDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || "Erro ao desassociar médico da clínica")
            }
        } catch {
            toast.error("Erro ao desassociar médico da clínica")
        } finally {
            setIsDeleting(false)
            setSelectedDoctor(null)
        }
    }

    const handleSaveRelationshipType = async () => {
        if (!selectedDoctor) return

        setIsSavingRelationship(true)
        try {
            const result = await updateDoctorRelationshipTypeAction(selectedDoctor.id, relationshipType)
            if (result.success) {
                toast.success("Tipo de vínculo atualizado com sucesso")
                setIsLinkDialogOpen(false)
                setSelectedDoctor(null)
                router.refresh()
            } else {
                toast.error("Erro ao atualizar vínculo do médico")
            }
        } catch {
            toast.error("Erro ao atualizar vínculo do médico")
        } finally {
            setIsSavingRelationship(false)
        }
    }

    const handleAssociateDoctor = async () => {
        if (!selectedDoctor) return

        setIsAssociating(true)
        try {
            const result = await associateDoctorToClinicAction(selectedDoctor.id, relationshipType)
            if (result.success) {
                toast.success("Médico associado à clínica com sucesso")
                setIsLinkDialogOpen(false)
                setSelectedDoctor(null)
                router.refresh()
            } else {
                toast.error("Erro ao associar médico à clínica")
            }
        } catch {
            toast.error("Erro ao associar médico à clínica")
        } finally {
            setIsAssociating(false)
        }
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[20%] min-w-[150px]">Nome</TableHead>
                            <TableHead className="w-[25%]">Especialidade</TableHead>
                            <TableHead className="w-[25%]">Áreas de Atuação</TableHead>
                            <TableHead className="whitespace-nowrap">CRM / Registro</TableHead>
                            <TableHead className="whitespace-nowrap">Pendências</TableHead>
                            <TableHead className="w-[80px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {doctors.length === 0 || groupedDoctors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {doctors.length === 0
                                        ? "Nenhum médico encontrado."
                                        : "Nenhum médico vinculado visível com o filtro atual."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            groupedDoctors.flatMap((group, index) => [
                                <TableRow key={`${group.key}-header`} className="bg-muted/20 hover:bg-muted/20">
                                    <TableCell colSpan={6} className="py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                                {group.title}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-border/60 bg-background/80 text-[11px] font-medium text-muted-foreground"
                                            >
                                                {group.doctors.length}
                                            </Badge>
                                            <span className="h-px flex-1 bg-border" />
                                        </div>
                                    </TableCell>
                                </TableRow>,
                                ...group.doctors.map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <TableCell className="font-medium cursor-pointer hover:text-primary transition-colors max-w-[200px] truncate" title={doctor.name || "-"} onClick={() => {
                                        setSelectedDoctor(doctor);
                                        setIsDetailsDialogOpen(true);
                                    }}>
                                        {doctor.name || "-"}
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <div className="flex flex-wrap gap-1">
                                            {doctor.specialties.length > 0 ? (
                                                doctor.specialties.map((s) => (
                                                    <Badge key={s.id} variant="secondary" className="border-none bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">
                                                        {s.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground/50">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <div className="flex flex-wrap gap-1">
                                            {doctor.practiceAreas && doctor.practiceAreas.length > 0 ? (
                                                doctor.practiceAreas.map((pa) => (
                                                    <Badge key={pa.id} variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none capitalize">
                                                        {pa.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground/50">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{doctor.crm ? `${doctor.crm}${doctor.crmState ? ` - ${doctor.crmState}` : ''}` : "-"}</TableCell>
                                    <TableCell>
                                        {(() => {
                                            const missing = getMissingInfo(doctor)
                                            if (missing.length === 0) {
                                                return <span className="text-muted-foreground/50">-</span>
                                            }
                                            return (
                                                <Badge
                                                    variant="destructive"
                                                    className="cursor-pointer hover:bg-destructive/80 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMissingInfoDoctor(doctor)
                                                    }}
                                                >
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    {missing.length} {missing.length === 1 ? 'pendência' : 'pendências'}
                                                </Badge>
                                            )
                                        })()}
                                    </TableCell>
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
                                                        setIsDetailsDialogOpen(true)
                                                    }}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {doctor.isAssociated && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedDoctor(doctor)
                                                                setIsQrDialogOpen(true)
                                                            }}
                                                        >
                                                            <QrCode className="mr-2 h-4 w-4" />
                                                            Ver QR Code
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}
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
                                                    onClick={() => {
                                                        setSelectedDoctor(doctor)
                                                        setIsPasswordDialogOpen(true)
                                                    }}
                                                    disabled={!doctor.isAssociated}
                                                >
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Definir senha
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedDoctor(doctor)
                                                        setRelationshipType(doctor.relationshipType ?? "linked")
                                                        setIsLinkDialogOpen(true)
                                                    }}
                                                >
                                                    <Link2 className="mr-2 h-4 w-4" />
                                                    Gerenciar vínculo
                                                </DropdownMenuItem>
                                                {doctor.isAssociated && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setSelectedDoctor(doctor)
                                                                setRelationshipType(doctor.relationshipType ?? "linked")
                                                                setIsLinkDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Inativar vínculo
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                )),
                                ...(index < groupedDoctors.length - 1
                                    ? [
                                        <TableRow key={`${group.key}-divider`} className="pointer-events-none bg-background">
                                            <TableCell colSpan={6} className="h-6 border-t-2 border-border/70 bg-background" />
                                        </TableRow>,
                                    ]
                                    : []),
                            ])
                        )}
                    </TableBody>
                </Table>
            </div>

            {normalizedSelectedDoctor && (
                <DoctorDetailsDialog
                    doctor={normalizedSelectedDoctor}
                    isOpen={isDetailsDialogOpen}
                    onOpenChange={(open) => {
                        setIsDetailsDialogOpen(open)
                        if (!open) {
                            setSelectedDoctor(null)
                        }
                    }}
                />
            )}

            {normalizedSelectedDoctor && (
                <EditDoctorDialog
                    doctor={normalizedSelectedDoctor}
                    isOpen={isEditDialogOpen}
                    onReferredPatientsChange={(referredPatients) => {
                        setSelectedDoctor((current) =>
                            current
                                ? {
                                      ...current,
                                      referredPatients,
                                  }
                                : current
                        )
                    }}
                    onOpenChange={(open) => {
                        setIsEditDialogOpen(open)
                        if (!open) {
                            setSelectedDoctor(null)
                        }
                    }}
                />
            )}

            <DoctorQRCodeDialog
                isOpen={isQrDialogOpen}
                onOpenChange={setIsQrDialogOpen}
                doctorName={selectedDoctor?.name ?? null}
                inviteCode={selectedDoctor?.inviteCode ?? null}
                relationshipType={selectedDoctor?.relationshipType ?? null}
            />

            <SetDoctorPasswordDialog
                doctor={selectedDoctor}
                isOpen={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
            />

            <Dialog
                open={isLinkDialogOpen}
                onOpenChange={(open) => {
                    setIsLinkDialogOpen(open)
                    if (!open && !isDeleting) {
                        setSelectedDoctor(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Vínculo com a Clínica</DialogTitle>
                        <DialogDescription>
                            Gerencie a associação do médico{" "}
                            <span className="font-semibold">{selectedDoctor?.name}</span> com esta clínica.
                            A desassociação remove o acesso desta unidade, mas mantém o cadastro global do profissional.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                        <div className="rounded-xl border bg-muted/30 p-5 text-sm">
                            <p>
                                <span className="font-medium">Status atual:</span>{" "}
                                {!selectedDoctor?.isAssociated
                                    ? "médico sem vínculo com esta clínica"
                                    : selectedDoctor?.relationshipType === "partner"
                                    ? "médico parceiro desta clínica"
                                    : "médico vinculado a esta clínica"}
                            </p>
                            <p className="mt-2 text-muted-foreground">
                                {selectedDoctor?.isAssociated
                                    ? "Para vincular novamente depois, use o fluxo de adicionar médico ou convite da própria clínica."
                                    : "Associe este médico à clínica para liberar QR code, vínculo de pacientes e demais ferramentas da unidade."}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-background p-5">
                            <div className="space-y-3">
                                <p className="text-sm font-medium">Tipo de relação com a clínica</p>
                                <Select
                                    value={relationshipType}
                                    onValueChange={(value: "linked" | "partner") => setRelationshipType(value)}
                                    disabled={isSavingRelationship || isDeleting}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Selecione o tipo de vínculo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="linked">Médico Vinculado</SelectItem>
                                        <SelectItem value="partner">Médico Parceiro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Vinculado pode assumir pacientes da clínica. Parceiro entra como origem de indicação no QR code e no referral.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:flex-wrap sm:justify-between">
                        {selectedDoctor?.isAssociated ? (
                            <div className="w-full sm:w-auto">
                                <Button
                                    variant="destructive"
                                    onClick={handleUnlinkDoctor}
                                    disabled={isDeleting || isSavingRelationship || isAssociating}
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting ? "Desassociando..." : "Desassociar da Clínica"}
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full sm:w-auto">
                                <Button
                                    onClick={handleAssociateDoctor}
                                    disabled={isAssociating || isSavingRelationship || isDeleting}
                                    className="w-full sm:w-auto"
                                >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    {isAssociating ? "Associando..." : "Associar à Clínica"}
                                </Button>
                            </div>
                        )}
                        <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={() => setIsLinkDialogOpen(false)}
                                disabled={isDeleting || isSavingRelationship || isAssociating}
                                className="w-full sm:w-auto"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleSaveRelationshipType}
                                disabled={
                                    isSavingRelationship ||
                                    isDeleting ||
                                    isAssociating ||
                                    !selectedDoctor?.isAssociated ||
                                    relationshipType === selectedDoctor?.relationshipType
                                }
                                className="w-full sm:w-auto"
                            >
                                {isSavingRelationship ? "Salvando..." : "Salvar Tipo de Vínculo"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!missingInfoDoctor}
                onOpenChange={(open) => {
                    if (!open) setMissingInfoDoctor(null)
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Informações Pendentes
                        </DialogTitle>
                        <DialogDescription>
                            O cadastro de <span className="font-semibold">{missingInfoDoctor?.name}</span> ainda está incompleto e precisa das seguintes informações:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {missingInfoDoctor && getMissingInfo(missingInfoDoctor).length > 0 ? (
                            <ul className="space-y-3">
                                {getMissingInfo(missingInfoDoctor).map((info, idx) => (
                                    <li key={idx} className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                                        <div className="h-2 w-2 rounded-full bg-destructive" />
                                        {info}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Tudo certo com os dados principais!</p>
                        )}
                    </div>
                    <DialogFooter className="gap-3 sm:justify-between">
                        <Button 
                            variant="outline" 
                            onClick={() => setMissingInfoDoctor(null)}
                        >
                            Fechar
                        </Button>
                        <Button 
                            onClick={() => {
                                const targetDoctor = missingInfoDoctor;
                                setMissingInfoDoctor(null);
                                if (targetDoctor) {
                                    setTimeout(() => {
                                        setSelectedDoctor(targetDoctor);
                                        setIsEditDialogOpen(true);
                                    }, 100);
                                }
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Cadastro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
