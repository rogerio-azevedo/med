"use client";

import { useState, useTransition } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    updateAppointmentStatusAction,
    cancelAppointmentAction,
} from "@/app/actions/appointments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    User,
    Stethoscope,
    Clock,
    CalendarIcon,
    MessageSquare,
    Loader2,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

type AppointmentStatus =
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "done"
    | "cancelled"
    | "no_show";

export type AppointmentDetail = {
    id: string;
    scheduledAt: Date | string;
    durationMinutes: number;
    modality: string;
    status: AppointmentStatus;
    notes: string | null;
    doctor: { id: string; name: string | null };
    patient: { id: string; name: string; phone: string | null; email: string | null };
    specialty: { id: string; name: string } | null;
};

const statusLabels: Record<AppointmentStatus, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    in_progress: "Em atendimento",
    done: "Concluído",
    cancelled: "Cancelado",
    no_show: "Faltou",
};

const statusColors: Record<AppointmentStatus, string> = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    confirmed: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    no_show: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const modalityLabels: Record<string, string> = {
    in_person: "Presencial",
    remote: "Teleconsulta",
    phone: "Telefone",
    whatsapp: "WhatsApp",
};

// Transições de status permitidas por status atual
const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    scheduled: ["confirmed", "cancelled", "no_show"],
    confirmed: ["in_progress", "cancelled", "no_show"],
    in_progress: ["done", "cancelled"],
    done: [],
    cancelled: [],
    no_show: [],
};

interface AppointmentDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: AppointmentDetail | null;
}

export function AppointmentDetailDrawer({
    open,
    onOpenChange,
    appointment,
}: AppointmentDetailDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [isCancelling, startCancelTransition] = useTransition();

    function handleStatusChange(newStatus: string) {
        if (!appointment) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", appointment.id);
            formData.set("status", newStatus);
            const result = await updateAppointmentStatusAction(formData);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Status atualizado!");
                onOpenChange(false);
            }
        });
    }

    function handleCancel() {
        if (!appointment) return;
        startCancelTransition(async () => {
            const result = await cancelAppointmentAction(appointment.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Agendamento cancelado.");
                onOpenChange(false);
            }
        });
    }

    if (!appointment) return null;

    const scheduledAt = new Date(appointment.scheduledAt);
    const endsAt = new Date(scheduledAt.getTime() + appointment.durationMinutes * 60000);
    const transitions = allowedTransitions[appointment.status];
    const isDone = appointment.status === "done" || appointment.status === "cancelled";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col w-full sm:max-w-md bg-background p-0 overflow-hidden">
                <SheetHeader className="px-6 py-5 border-b bg-card">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <SheetTitle className="text-xl">Detalhes da Consulta</SheetTitle>
                            <SheetDescription className="text-sm mt-1">
                                {format(scheduledAt, "EEEE, d 'de' MMMM 'de' yyyy", {
                                    locale: ptBR,
                                })}
                            </SheetDescription>
                        </div>
                        <Badge
                            className={`px-2.5 py-0.5 whitespace-nowrap border-0 ${statusColors[appointment.status]}`}
                            variant="outline"
                        >
                            {statusLabels[appointment.status]}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/30">

                    {/* Bloco 1: Data, Hora e Local */}
                    <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                    {format(scheduledAt, "HH:mm")} – {format(endsAt, "HH:mm")}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Duração: {appointment.durationMinutes} minutos
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 rounded-full bg-accent text-accent-foreground shrink-0">
                                {appointment.modality === "in_person" ? <User className="size-5" /> : <MessageSquare className="size-5" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                    Modalidade
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {modalityLabels[appointment.modality] ?? appointment.modality}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bloco 2: Profissional e Paciente */}
                    <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground shrink-0">
                                <Stethoscope className="size-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profissional</p>
                                <p className="text-sm font-medium text-foreground">{appointment.doctor.name}</p>
                                {appointment.specialty && (
                                    <p className="text-xs text-muted-foreground">
                                        {appointment.specialty.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground shrink-0">
                                <User className="size-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</p>
                                <p className="text-sm font-medium text-foreground">{appointment.patient.name}</p>
                                {appointment.patient.phone && (
                                    <p className="text-xs text-muted-foreground">
                                        {appointment.patient.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bloco 3: Observações */}
                    {appointment.notes && (
                        <div className="bg-accent/50 border border-accent rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações internas</p>
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{appointment.notes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Rodapé de Ações */}
                <div className="p-6 bg-card border-t space-y-4">
                    {/* Alterar status */}
                    {!isDone && transitions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alterar Status</p>
                            <Select onValueChange={handleStatusChange} disabled={isPending}>
                                <SelectTrigger className="h-10 bg-background shadow-sm">
                                    <SelectValue placeholder="Selecione o novo status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {transitions.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {statusLabels[s]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isPending && (
                                <div className="flex items-center gap-2 text-xs text-primary pt-1 animate-pulse">
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Atualizando registro...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cancelar */}
                    {!isDone && (
                        <Button
                            variant="destructive"
                            className="w-full shadow-sm hover:shadow-md transition-all"
                            onClick={handleCancel}
                            disabled={isCancelling || isPending}
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Cancelando...
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-2 size-4" />
                                    Cancelar Agendamento
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
