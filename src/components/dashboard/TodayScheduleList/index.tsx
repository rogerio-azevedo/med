import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Phone, MessageCircle, User } from "lucide-react";
import Link from "next/link";

type AppointmentModality = "in_person" | "remote" | "phone" | "whatsapp";
type AppointmentStatus =
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "done"
    | "cancelled"
    | "no_show";

interface ScheduleItem {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    modality: AppointmentModality;
    status: AppointmentStatus | null;
    notes: string | null;
    patientName: string;
    doctorName: string | null;
}

interface TodayScheduleListProps {
    appointments: ScheduleItem[];
    showDoctor?: boolean; // Admin sees doctor, Doctor sees patient only
    emptyMessage?: string;
}

const modalityConfig: Record<
    AppointmentModality,
    { label: string; Icon: typeof Video; className: string }
> = {
    in_person: { label: "Presencial", Icon: User, className: "text-blue-500" },
    remote: { label: "Teleconsulta", Icon: Video, className: "text-purple-500" },
    phone: { label: "Telefone", Icon: Phone, className: "text-orange-500" },
    whatsapp: { label: "WhatsApp", Icon: MessageCircle, className: "text-green-500" },
};

const statusConfig: Record<
    AppointmentStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    scheduled: { label: "Agendado", variant: "secondary" },
    confirmed: { label: "Confirmado", variant: "default" },
    in_progress: { label: "Em atendimento", variant: "default" },
    done: { label: "Concluído", variant: "secondary" },
    cancelled: { label: "Cancelado", variant: "destructive" },
    no_show: { label: "Não compareceu", variant: "destructive" },
};

function formatTime(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

function getInitials(name: string | null) {
    if (!name) return "?";
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

export function TodayScheduleList({
    appointments,
    showDoctor = true,
    emptyMessage = "Nenhum agendamento para hoje.",
}: TodayScheduleListProps) {
    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <Calendar className="size-10 opacity-30" />
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y">
            {appointments.map((apt) => {
                const modality = modalityConfig[apt.modality] ?? modalityConfig.in_person;
                const status = apt.status ? statusConfig[apt.status] : null;
                const ModalityIcon = modality.Icon;

                const personName = apt.patientName;
                const secondaryLabel = showDoctor && apt.doctorName ? `Dr. ${apt.doctorName}` : null;

                return (
                    <div
                        key={apt.id}
                        className="flex items-center gap-4 px-2 py-3 hover:bg-muted/40 rounded-lg transition-colors"
                    >
                        {/* Time */}
                        <div className="flex flex-col items-center min-w-[52px] shrink-0">
                            <span className="text-sm font-semibold tabular-nums">
                                {formatTime(apt.scheduledAt)}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                <span>{apt.durationMinutes}min</span>
                            </div>
                        </div>

                        {/* Avatar */}
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {getInitials(personName)}
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                            <p className="text-sm font-medium truncate">{personName}</p>
                            {secondaryLabel && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {secondaryLabel}
                                </p>
                            )}
                        </div>

                        {/* Modality + Status */}
                        <div className="flex items-center gap-2 shrink-0">
                            <ModalityIcon
                                className={cn("size-4", modality.className)}
                                aria-label={modality.label}
                            />
                            {status && (
                                <Badge variant={status.variant} className="text-xs">
                                    {status.label}
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
