"use client";

import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Activity, 
    Stethoscope, 
    Calendar, 
    Clock, 
    User, 
    ClipboardList,
    FileText,
    Pill,
    Microscope,
    ExternalLink,
    Pencil,
    Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteConsultationAction } from "@/app/actions/consultations";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConsultationDetailSheetProps {
    consultationId: string | null;
    onClose: () => void;
    onEdit?: (consultation: any) => void;
    patientId: string;
    currentDoctorId?: string;
}

export function ConsultationDetailSheet({ consultationId, onClose, onEdit, patientId, currentDoctorId }: ConsultationDetailSheetProps) {
    const [loading, setLoading] = useState(false);
    const [consultation, setConsultation] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (consultationId) {
            fetchConsultation();
        } else {
            setConsultation(null);
        }
    }, [consultationId]);

    const fetchConsultation = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/consultations/${consultationId}`);
            if (response.ok) {
                const data = await response.json();
                setConsultation(data);
            }
        } catch (error) {
            console.error("Error fetching consultation details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (onEdit && consultation) {
            onEdit(consultation);
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!consultationId) return;
        
        setIsDeleting(true);
        try {
            const result = await deleteConsultationAction(consultationId, patientId);
            if (result.success) {
                toast.success("Atendimento excluído com sucesso!");
                onClose();
            } else {
                toast.error("Erro ao excluir atendimento: " + result.error);
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao excluir o atendimento.");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const isOpen = !!consultationId;
    const isAuthor = consultation && currentDoctorId && consultation.doctorId === currentDoctorId;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col gap-0 border-l shadow-2xl">
                    {loading ? (
                        <div className="p-6 space-y-6">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : consultation ? (
                        <>
                            {/* Custom Header */}
                            <div className="p-6 pr-12 bg-muted/30 border-b">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="bg-background">
                                                {translateType(consultation.type)}
                                            </Badge>
                                            <Badge variant={consultation.status === 'finalized' ? 'default' : 'secondary'} className="capitalize">
                                                {consultation.status === 'finalized' ? 'Finalizado' : 'Em Andamento'}
                                            </Badge>
                                        </div>
                                        <SheetTitle className="text-2xl font-bold">
                                            {consultation.soap?.diagnosisFreeText || "Atendimento Clínico"}
                                        </SheetTitle>
                                    </div>
                                    {isAuthor && (
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" className="gap-2" onClick={handleEdit}>
                                                <Pencil className="h-4 w-4" />
                                                Editar
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                                <Trash2 className="h-4 w-4" />
                                                Excluir
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(new Date(consultation.startTime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{format(new Date(consultation.startTime), "HH:mm")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-2">
                                        <User className="h-4 w-4" />
                                        <span>Médico Responsável: <span className="text-foreground font-medium">{consultation.doctor?.user?.name}</span></span>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-8">
                                    {/* Diagnóstico CID-10 se houver */}
                                    {consultation.soap?.diagnosisCid && (
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                            <div className="text-xs font-semibold text-primary uppercase mb-1 tracking-wider">Diagnóstico Confirmado (CID-10)</div>
                                            <div className="flex items-center gap-3">
                                                <Badge className="text-sm px-2 py-0.5">{consultation.soap.diagnosisCid.code}</Badge>
                                                <span className="font-medium text-foreground">{consultation.soap.diagnosisCid.description}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sinais Vitais */}
                                    {consultation.vitalSigns?.[0] && (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                                                <Activity className="h-4 w-4" />
                                                Sinais Vitais
                                            </h3>
                                            <div className="grid grid-cols-4 gap-3">
                                                <VitalCard label="PA" value={consultation.vitalSigns[0].bloodPressure} />
                                                <VitalCard label="Peso" value={consultation.vitalSigns[0].weight ? `${consultation.vitalSigns[0].weight} kg` : null} />
                                                <VitalCard label="FC" value={consultation.vitalSigns[0].heartRate ? `${consultation.vitalSigns[0].heartRate} bpm` : null} />
                                                <VitalCard label="Temp" value={consultation.vitalSigns[0].temperature ? `${consultation.vitalSigns[0].temperature} °C` : null} />
                                            </div>
                                        </div>
                                    )}

                                    {/* SOAP Sections */}
                                    <div className="space-y-6">
                                        <SoapSection 
                                            icon={<User className="h-4 w-4" />} 
                                            title="Subjetivo" 
                                            content={consultation.soap?.subjective} 
                                            subtitle="Queixa principal e história da doença atual"
                                        />
                                        <SoapSection 
                                            icon={<Stethoscope className="h-4 w-4" />} 
                                            title="Objetivo" 
                                            content={consultation.soap?.objective} 
                                            subtitle="Achados do exame físico e exames complementares"
                                        />
                                        <SoapSection 
                                            icon={<ClipboardList className="h-4 w-4" />} 
                                            title="Avaliação" 
                                            content={consultation.soap?.assessment} 
                                            subtitle="Raciocínio clínico e hipóteses"
                                        />
                                        <SoapSection 
                                            icon={<FileText className="h-4 w-4" />} 
                                            title="Plano" 
                                            content={consultation.soap?.plan} 
                                            subtitle="Condutas, orientações e encaminhamentos"
                                        />
                                    </div>

                                    {/* Prescrições e Exames (Placeholders se houver dados futuros) */}
                                    {(consultation.prescriptions?.length > 0 || consultation.examRequests?.length > 0) && (
                                        <div className="grid grid-cols-1 gap-4 pt-4">
                                            {consultation.prescriptions?.length > 0 && (
                                                <div className="border rounded-lg p-4 bg-muted/20">
                                                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                                                        <Pill className="h-4 w-4 text-primary" />
                                                        Prescrições
                                                    </h4>
                                                    <ul className="text-sm space-y-1 text-muted-foreground italic">
                                                        <li>Consultar no módulo de prescrições</li>
                                                    </ul>
                                                </div>
                                            )}
                                            {consultation.examRequests?.length > 0 && (
                                                <div className="border rounded-lg p-4 bg-muted/20">
                                                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                                                        <Microscope className="h-4 w-4 text-primary" />
                                                        Solicitações de Exames
                                                    </h4>
                                                    <ul className="text-sm space-y-1 text-muted-foreground italic">
                                                        <li>Consultar no módulo de exames</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="p-4 border-t bg-muted/10 flex justify-end">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                                    ID: {consultation.id}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            <p>Não foi possível carregar os detalhes do atendimento.</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Atendimento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o prontuário 
                            e todos os dados associados a este atendimento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function VitalCard({ label, value }: { label: string, value: string | null }) {
    return (
        <div className="bg-background border rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
            <p className="font-bold text-sm">{value || "--"}</p>
        </div>
    );
}

function SoapSection({ icon, title, content, subtitle }: { icon: any, title: string, content: string | null, subtitle: string }) {
    if (!content) return null;
    
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10 text-primary">
                    {icon}
                </div>
                <h4 className="font-bold text-foreground">{title}</h4>
            </div>
            <div className="pl-9">
                <p className="text-xs text-muted-foreground mb-2 italic">{subtitle}</p>
                <div className="p-4 bg-muted/20 rounded-lg text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {content}
                </div>
            </div>
        </div>
    );
}

function translateType(type: string) {
    const types: Record<string, string> = {
        consultation: "Consulta",
        return: "Retorno",
        emergency: "Urgência",
        procedure: "Procedimento",
        remote: "Telemedicina",
        phone: "Telefone",
    };
    return types[type] || type;
}
