"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { FileCard, type PatientFileRow } from "../FileCard";
import { FileUploadModal } from "../FileUploadModal";
import { PrescriptionItemDetails } from "../PrescriptionItemDetails";
import { PrescriptionPrintButtons } from "../PrescriptionPrintButtons";

export type ConsultationPrescriptionRow = {
    id: string;
    medicineName: string;
    dosage?: string | null;
    pharmaceuticalForm?: string | null;
    frequency?: string | null;
    duration?: string | null;
    quantity?: string | null;
    route?: string | null;
    instructions?: string | null;
    isContinuous?: boolean | null;
    startDate?: string | null;
    endDate?: string | null;
};

export type ConsultationDetailData = {
    id: string;
    doctorId?: string | null;
    status: string;
    startTime: string | Date;
    soap?: {
        subjective?: string | null;
        objective?: string | null;
        assessment?: string | null;
        plan?: string | null;
        diagnosisFreeText?: string | null;
        diagnosisCid?: {
            code: string;
            description: string;
        } | null;
    } | null;
    vitalSigns?: Array<{
        bloodPressure?: string | null;
        weight?: string | null;
        height?: string | null;
        heartRate?: number | null;
        temperature?: string | null;
    }>;
    serviceType?: {
        name?: string | null;
        workflow?: string | null;
    } | null;
    serviceTypeId?: string | null;
    healthInsurance?: {
        name?: string | null;
    } | null;
    healthInsuranceId?: string | null;
    doctor?: {
        user?: {
            name?: string | null;
        } | null;
    } | null;
    prescriptions?: ConsultationPrescriptionRow[];
    examRequests?: unknown[];
};

interface ConsultationDetailSheetProps {
    consultationId: string | null;
    onClose: () => void;
    onEdit?: (consultation: ConsultationDetailData) => void;
    patientId: string;
    currentDoctorId?: string;
    /** Recarrega dados do servidor (timeline, listas) após arquivo ou exclusão de consulta */
    onTimelineRefresh?: () => void;
}

export function ConsultationDetailSheet({
    consultationId,
    onClose,
    onEdit,
    patientId,
    currentDoctorId,
    onTimelineRefresh,
}: ConsultationDetailSheetProps) {
    const [loading, setLoading] = useState(false);
    const [consultation, setConsultation] = useState<ConsultationDetailData | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [files, setFiles] = useState<PatientFileRow[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);

    const loadFiles = useCallback(async () => {
        if (!consultationId) return;
        setFilesLoading(true);
        try {
            const res = await fetch(`/api/consultations/${consultationId}/files`);
            if (res.ok) {
                const data = (await res.json()) as PatientFileRow[];
                setFiles(data);
            } else {
                setFiles([]);
            }
        } catch {
            setFiles([]);
        } finally {
            setFilesLoading(false);
        }
    }, [consultationId]);

    const fetchConsultation = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/consultations/${consultationId}`);
            if (response.ok) {
                const data = (await response.json()) as ConsultationDetailData;
                setConsultation(data);
            }
        } catch (error) {
            console.error("Error fetching consultation details:", error);
        } finally {
            setLoading(false);
        }
    }, [consultationId]);

    useEffect(() => {
        if (consultationId) {
            void fetchConsultation();
            void loadFiles();
        } else {
            setConsultation(null);
            setFiles([]);
        }
    }, [consultationId, fetchConsultation, loadFiles]);

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
                onTimelineRefresh?.();
            } else {
                toast.error(`Erro ao excluir atendimento: ${result.error}`);
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
                <SheetContent className="sm:max-w-2xl w-full overflow-hidden p-0 flex flex-col gap-0 border-l shadow-2xl">
                    {loading ? (
                        <div className="p-6 space-y-6">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : consultation ? (
                        <>
                            {/* Custom Header */}
                            <div className="shrink-0 border-b bg-muted/30 p-6 pr-12">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                             <Badge variant="outline" className="bg-background">
                                                {consultation.serviceType?.name || "Atendimento"}
                                             </Badge>
                                            <Badge variant={consultation.status === "finished" ? "default" : "secondary"} className="capitalize">
                                                {detailStatusLabel(consultation.status)}
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
                                         <span>Médico responsável:{" "}
                                             <span className="text-foreground font-medium">
                                                 {consultation.doctor?.user?.name ?? (consultation.status === "waiting" ? "Aguardando" : "—")}
                                             </span>
                                         </span>
                                     </div>
                                     {consultation.healthInsurance?.name ? (
                                         <div className="col-span-2 flex items-center gap-2">
                                             <FileText className="h-4 w-4" />
                                             <span>Convênio: <span className="text-foreground font-medium">{consultation.healthInsurance.name}</span></span>
                                         </div>
                                     ) : null}
                                 </div>
                            </div>

                            <ScrollArea className="min-h-0 flex-1">
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
                                            content={consultation.soap?.subjective ?? null}
                                            subtitle="Queixa principal e história da doença atual"
                                        />
                                        <SoapSection
                                            icon={<Stethoscope className="h-4 w-4" />}
                                            title="Objetivo"
                                            content={consultation.soap?.objective ?? null}
                                            subtitle="Achados do exame físico e exames complementares"
                                        />
                                        <SoapSection
                                            icon={<ClipboardList className="h-4 w-4" />}
                                            title="Avaliação"
                                            content={consultation.soap?.assessment ?? null}
                                            subtitle="Raciocínio clínico e hipóteses"
                                        />
                                        <SoapSection
                                            icon={<FileText className="h-4 w-4" />}
                                            title="Plano"
                                            content={consultation.soap?.plan ?? null}
                                            subtitle="Condutas, orientações e encaminhamentos"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                Arquivos desta consulta
                                            </h3>
                                            {isAuthor ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => setUploadOpen(true)}
                                                >
                                                    Adicionar arquivo
                                                </Button>
                                            ) : null}
                                        </div>
                                        {filesLoading ? (
                                            <p className="text-sm text-muted-foreground">Carregando arquivos…</p>
                                        ) : files.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">
                                                Nenhum arquivo vinculado a esta consulta.
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {files.map((f) => (
                                                    <li key={f.id}>
                                                        <FileCard
                                                            file={f}
                                                            onDeleted={loadFiles}
                                                            canDelete={!!isAuthor}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Prescrições e Exames (Placeholders se houver dados futuros) */}
                                    {((consultation.prescriptions?.length ?? 0) > 0 ||
                                        (consultation.examRequests?.length ?? 0) > 0) && (
                                        <div className="grid grid-cols-1 gap-4 pt-4">
                                            {(consultation.prescriptions?.length ?? 0) > 0 && (
                                                <div className="rounded-xl border bg-muted/20 p-4">
                                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <h4 className="flex items-center gap-2 font-semibold">
                                                            <Pill className="h-4 w-4 text-primary" />
                                                            Prescrições
                                                        </h4>
                                                        <PrescriptionPrintButtons
                                                            patientId={patientId}
                                                            consultationId={consultation.id}
                                                            className="sm:justify-end"
                                                        />
                                                    </div>
                                                    <ul className="space-y-4">
                                                        {consultation.prescriptions!.map((rx, idx) => (
                                                            <li
                                                                key={rx.id}
                                                                className="rounded-xl border bg-card p-4 shadow-sm"
                                                            >
                                                                <PrescriptionItemDetails item={rx} index={idx + 1} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {(consultation.examRequests?.length ?? 0) > 0 && (
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
                            <div className="shrink-0 border-t bg-muted/10 p-4 flex justify-end">
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

            <FileUploadModal
                open={uploadOpen}
                onOpenChange={setUploadOpen}
                patientId={patientId}
                consultationId={consultationId}
                onSuccess={() => {
                    void loadFiles();
                    onTimelineRefresh?.();
                }}
            />

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

function VitalCard({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="bg-background border rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
            <p className="font-bold text-sm">{value ?? "--"}</p>
        </div>
    );
}

function SoapSection({ icon, title, content, subtitle }: { icon: ReactNode; title: string; content: string | null; subtitle: string }) {
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

function detailStatusLabel(status: string) {
    if (status === "finished") return "Finalizado";
    if (status === "waiting") return "Na fila";
    if (status === "cancelled") return "Cancelado";
    if (status === "in_progress") return "Em andamento";
    return status;
}
