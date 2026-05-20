"use client";

import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Microscope,
    Calendar,
    Clock,
    User,
    MapPin,
    Link2,
    Trash2,
    Loader2,
    Stethoscope,
    Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { deleteExamAction } from "@/app/actions/exams";

type ExamDetailApiRow = {
    id: string;
    doctorId?: string | null;
    status: string;
    location: string;
    notes?: string | null;
    startTime: string;
    endTime?: string | null;
    consultationId?: string | null;
    examRequestId?: string | null;
    doctor?: {
        user?: { name?: string | null } | null;
    } | null;
    serviceType?: { name?: string | null } | null;
    healthInsurance?: { name?: string | null } | null;
    procedureLinks?: Array<{
        id: string;
        quantity: number | null;
        notes?: string | null;
        procedure: { id: string; name: string; tussCode?: string | null };
    }>;
};

interface ExamDetailSheetProps {
    examId: string | null;
    patientId: string;
    onClose: () => void;
    onOpenConsultation?: (consultationId: string) => void;
    currentDoctorId?: string;
    canDeleteAsAdmin?: boolean;
    onTimelineRefresh?: () => void;
    /** Abre o fluxo completo de registro (`ExamForm`) para este exame já iniciado. */
    onContinueRegistration?: (examId: string) => void;
    /** Abre o `ExamForm` para revisar/editar procedimentos e laudo já salvos. */
    onEditExam?: (examId: string) => void;
    /** Permissões do módulo prontuário (combinadas no cliente com médico executor). */
    chartCanUpdateMedicalRecords?: boolean;
    chartCanDeleteMedicalRecords?: boolean;
    /** Alinhado a “Novo exame”: só médicos iniciam continuam pela UI (servidor permite equipe quando aplicável). */
    isDoctor?: boolean;
}

export function ExamDetailSheet({
    examId,
    patientId,
    onClose,
    onOpenConsultation,
    currentDoctorId,
    canDeleteAsAdmin = false,
    onTimelineRefresh,
    onContinueRegistration,
    onEditExam,
    chartCanUpdateMedicalRecords = false,
    chartCanDeleteMedicalRecords = false,
    isDoctor = false,
}: ExamDetailSheetProps) {
    const [exam, setExam] = useState<ExamDetailApiRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        if (!examId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/exams/${examId}`);
            if (!res.ok) {
                setError(res.status === 404 ? "Exame não encontrado." : "Erro ao carregar.");
                setExam(null);
                return;
            }
            const data = (await res.json()) as ExamDetailApiRow;
            setExam(data);
        } catch {
            setError("Erro ao carregar.");
            setExam(null);
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        void load();
    }, [load]);

    const doctorIdOnRecord = exam?.doctorId ?? null;
    const userCanDeleteAsDoctor =
        !!currentDoctorId && !!doctorIdOnRecord && doctorIdOnRecord === currentDoctorId;
    const isExecutor = !!currentDoctorId && !!doctorIdOnRecord && doctorIdOnRecord === currentDoctorId;

    const showDeleteHeader =
        !!exam &&
        exam.status !== "cancelled" &&
        (chartCanDeleteMedicalRecords || canDeleteAsAdmin || userCanDeleteAsDoctor);

    const canEditMedicalRecordExam =
        !!exam &&
        exam.status !== "cancelled" &&
        (exam.status === "finished" || exam.status === "in_progress") &&
        !!onEditExam &&
        (chartCanUpdateMedicalRecords || canDeleteAsAdmin || isExecutor);

    const handleDelete = async () => {
        if (!examId) return;
        setDeleting(true);
        try {
            const res = await deleteExamAction(examId, patientId);
            if (!res.success) {
                toast.error(res.error ?? "Não foi possível excluir.");
                return;
            }
            toast.success("Exame excluído.");
            setDeleteOpen(false);
            onClose();
            onTimelineRefresh?.();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Sheet
                open={!!examId}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                    <div className="flex items-start gap-3 border-b px-6 py-4 pr-14">
                        <div className="mt-0.5 shrink-0 rounded-lg bg-teal-500/15 p-2 text-teal-700 dark:text-teal-200">
                            <Microscope className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <SheetTitle className="text-left text-lg font-bold leading-snug">
                                        Registro de exame
                                    </SheetTitle>
                                    {exam?.serviceType?.name ? (
                                        <p className="mt-1 truncate text-sm text-muted-foreground">
                                            {exam.serviceType.name}
                                        </p>
                                    ) : null}
                                </div>
                                {(canEditMedicalRecordExam || showDeleteHeader) && exam ? (
                                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                        {canEditMedicalRecordExam ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => onEditExam?.(exam.id)}
                                            >
                                                <Pencil className="size-4" />
                                                Editar
                                            </Button>
                                        ) : null}
                                        {showDeleteHeader ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setDeleteOpen(true)}
                                            >
                                                <Trash2 className="size-4" />
                                                Excluir
                                            </Button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-6 px-6 py-5">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : error ? (
                                <p className="text-sm text-destructive">{error}</p>
                            ) : exam ? (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{statusLabel(exam.status)}</Badge>
                                        <Badge variant="secondary">
                                            {exam.location === "in_clinic" ? "Na clínica" : "Externo"}
                                        </Badge>
                                    </div>

                                    <dl className="grid gap-3 text-sm">
                                        <div className="flex gap-2">
                                            <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                                                    Início
                                                </dt>
                                                <dd>{format(new Date(exam.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}</dd>
                                            </div>
                                        </div>
                                        {exam.endTime ? (
                                            <div className="flex gap-2">
                                                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                <div>
                                                    <dt className="text-xs font-semibold uppercase text-muted-foreground">
                                                        Término
                                                    </dt>
                                                    <dd>
                                                        {format(new Date(exam.endTime), "dd/MM/yyyy HH:mm", {
                                                            locale: ptBR,
                                                        })}
                                                    </dd>
                                                </div>
                                            </div>
                                        ) : null}
                                        <div className="flex gap-2">
                                            <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                                                    Executor
                                                </dt>
                                                <dd>{exam.doctor?.user?.name ?? "—"}</dd>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                                                    Convênio
                                                </dt>
                                                <dd>{exam.healthInsurance?.name ?? "—"}</dd>
                                            </div>
                                        </div>
                                    </dl>

                                    {exam.consultationId ? (
                                        <div className="rounded-lg border bg-muted/30 p-3">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Link2 className="size-4" />
                                                Consulta vinculada
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Este exame foi registrado no contexto de um atendimento.
                                            </p>
                                            {onOpenConsultation ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3 gap-2"
                                                    onClick={() => {
                                                        onOpenConsultation(exam.consultationId!);
                                                        onClose();
                                                    }}
                                                >
                                                    <Stethoscope className="size-4" />
                                                    Abrir consulta
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold">Procedimentos</h3>
                                        {exam.procedureLinks && exam.procedureLinks.length > 0 ? (
                                            <ul className="space-y-2">
                                                {exam.procedureLinks.map((pl) => (
                                                    <li
                                                        key={pl.id}
                                                        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border bg-background px-3 py-2 text-sm"
                                                    >
                                                        <span
                                                            className="min-w-0 flex-1 truncate font-medium"
                                                            title={pl.procedure.name}
                                                        >
                                                            {pl.procedure.name}
                                                        </span>
                                                        {pl.procedure.tussCode ? (
                                                            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                                                                TUSS {pl.procedure.tussCode}
                                                            </span>
                                                        ) : null}
                                                        {pl.quantity != null && pl.quantity > 1 ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="shrink-0 text-[10px]"
                                                            >
                                                                Qtd. {pl.quantity}
                                                            </Badge>
                                                        ) : null}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nenhum procedimento listado.</p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold">Registro / laudo</h3>
                                        <p className="whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">
                                            {exam.notes?.trim() ? exam.notes : "Sem texto registrado."}
                                        </p>
                                    </div>

                                    {exam.status === "in_progress" && isDoctor && onContinueRegistration ? (
                                        <Button
                                            type="button"
                                            size="lg"
                                            className="w-full shrink-0"
                                            onClick={() => {
                                                onContinueRegistration(exam.id);
                                                onClose();
                                            }}
                                        >
                                            Continuar registro
                                        </Button>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir registro de exame?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Os vínculos com pedidos de exame serão desfeitos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault();
                                void handleDelete();
                            }}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Excluindo…
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        scheduled: "Agendado",
        in_progress: "Em andamento",
        finished: "Concluído",
        cancelled: "Cancelado",
    };
    return map[status] ?? status;
}
