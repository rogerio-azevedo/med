"use client";

import { format } from "date-fns";
import { User } from "lucide-react";
import Link from "next/link";
import { resolveServiceTypeDisplayIcon } from "@/lib/formatters/resolve-service-type-display";
import { QuickCheckInButton } from "@/components/schedule/QuickCheckInButton";

type AppointmentStatus =
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "done"
    | "cancelled"
    | "no_show";

export type AppointmentCardData = {
    id: string;
    scheduledAt: Date | string;
    durationMinutes: number;
    status: AppointmentStatus;
    modality: string;
    notes?: string | null;
    patient: { id: string; name: string; phone: string | null };
    doctor: { id: string; name: string | null }; // null possible from DB join
    /** Legado / integrações */
    specialty: { id: string; name: string } | null;
    serviceType: {
        id: string;
        name: string;
        workflow: string;
        timelineIconKey: string | null;
        timelineColorHex: string | null;
    } | null;
    /** true quando já existe um check-in vinculado a este agendamento */
    hasCheckIn?: boolean;
};

const statusColors: Record<AppointmentStatus, string> = {
    scheduled: "bg-blue-500",
    confirmed: "bg-teal-500",
    in_progress: "bg-amber-500",
    done: "bg-green-600",
    cancelled: "bg-slate-400",
    no_show: "bg-red-500",
};

/** Tom estável por médico (vista compacta), sobre a cor de modalidade — não usa box-shadow para não conflitar com shadow-sm. */
function compactDoctorToneClass(doctorId: string | null | undefined): string {
    if (!doctorId) return "";
    let h = 0;
    for (let i = 0; i < doctorId.length; i++) h = (h * 31 + doctorId.charCodeAt(i)) | 0;
    const i = Math.abs(h) % 6;
    const overlays = [
        "before:absolute before:inset-0 before:z-0 before:rounded-md before:bg-violet-500/14 before:pointer-events-none before:content-[''] dark:before:bg-violet-400/18",
        "before:absolute before:inset-0 before:z-0 before:rounded-md before:bg-teal-500/14 before:pointer-events-none before:content-[''] dark:before:bg-teal-400/18",
        "before:absolute before:inset-0 before:z-0 before:rounded-md before:bg-rose-500/13 before:pointer-events-none before:content-[''] dark:before:bg-rose-400/18",
        "before:absolute before:inset-0 before:z-0 before:rounded-md before:bg-amber-500/14 before:pointer-events-none before:content-[''] dark:before:bg-amber-400/18",
        "before:absolute before:inset-0 before:z-0 before:rounded-md before:bg-sky-500/14 before:pointer-events-none before:content-[''] dark:before:bg-sky-400/18",
        "before:absolute before:inset-0 before:z-0 before:rounded-md before:bg-indigo-500/13 before:pointer-events-none before:content-[''] dark:before:bg-indigo-400/18",
    ];
    return overlays[i] ?? overlays[0];
}

const modalityStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    in_person: {
        bg: "bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        icon: <span title="Presencial">🏥</span>,
    },
    remote: {
        bg: "bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-300",
        icon: <span title="Teleconsulta">💻</span>,
    },
    phone: {
        bg: "bg-orange-50/80 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-300",
        icon: <span title="Telefone">📞</span>,
    },
    whatsapp: {
        bg: "bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
        icon: <span title="WhatsApp">💬</span>,
    },
};

interface AppointmentCardProps {
    appointment: AppointmentCardData;
    onClick: (appointment: AppointmentCardData) => void;
    /** For calendar view: top offset in px and height in px */
    style?: React.CSSProperties;
    compact?: boolean;
    /** Vista calendário com faixas lado a lado: destaca tom estável por médico */
    compactDoctorTint?: boolean;
    /** Exibe atalho de check-in (requer permissão de check-ins na página) */
    showQuickCheckIn?: boolean;
}

export function AppointmentCard({
    appointment,
    onClick,
    style,
    compact = false,
    compactDoctorTint = false,
    showQuickCheckIn = false,
}: AppointmentCardProps) {
    const modStyle = modalityStyles[appointment.modality] || modalityStyles.in_person;
    const st = appointment.serviceType;
    const ServiceIcon = st
        ? resolveServiceTypeDisplayIcon({
              name: st.name,
              workflow: st.workflow,
              timelineIconKey: st.timelineIconKey,
          })
        : null;
    const statusColor = statusColors[appointment.status] || "bg-border";
    const start = new Date(appointment.scheduledAt);
    const medicalRecordHref = `/medical-records/${appointment.patient.id}`;
    const doctorTone =
        compact && compactDoctorTint ? compactDoctorToneClass(appointment.doctor.id) : "";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(appointment);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick(appointment);
                }
            }}
            style={style}
            title={`${format(start, "HH:mm")} — ${appointment.patient.name}${appointment.doctor.name ? ` — ${appointment.doctor.name}` : ""}`}
            className={`group text-left rounded-md border-l-4 transition-all cursor-pointer shadow-sm hover:shadow-md ${compact ? "relative min-w-0 max-w-full overflow-hidden p-0" : "w-full pr-3 py-2"} ${statusColor.replace("bg-", "border-")} ${modStyle.bg} ${doctorTone}`}
        >
            {compact ? (
                /* Compact (calendar view): hora + ícone na primeira linha; nome com até 2 linhas. */
                <div className="relative z-10 flex h-full min-h-0 flex-col gap-0.5 overflow-hidden px-1.5 py-1">
                    {showQuickCheckIn ? (
                        <div
                            className="absolute bottom-0 right-0 z-20 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <QuickCheckInButton
                                status={appointment.status}
                                patientId={appointment.patient.id}
                                doctorId={appointment.doctor.id}
                                serviceTypeId={appointment.serviceType?.id ?? null}
                                hasCheckIn={appointment.hasCheckIn}
                                variant="icon"
                                className="size-6 bg-background/80 shadow-sm hover:bg-background"
                            />
                        </div>
                    ) : null}
                    <div className="flex shrink-0 items-center justify-between gap-0.5">
                        <div
                            className={`truncate text-[10px] font-bold tabular-nums leading-none ${modStyle.text}`}
                        >
                            {format(start, "HH:mm")}
                        </div>
                        <div className="flex shrink-0 items-center justify-center opacity-85">
                            {ServiceIcon && st ? (
                                <span
                                    className="flex size-3.5 items-center justify-center rounded"
                                    style={{
                                        color: st.timelineColorHex ?? undefined,
                                    }}
                                    title={st.name}
                                >
                                    <ServiceIcon className="size-3" />
                                </span>
                            ) : (
                                <span className="scale-90 [&>span]:text-[10px]">{modStyle.icon}</span>
                            )}
                        </div>
                    </div>
                    <div
                        className={`flex-1 min-h-0 overflow-hidden ${showQuickCheckIn ? "pr-5 pb-0.5" : ""}`}
                    >
                        <Link
                            href={medicalRecordHref}
                            onClick={(e) => e.stopPropagation()}
                            className="line-clamp-2 text-[10px] font-semibold leading-snug text-foreground/90 transition hover:underline focus-visible:underline sm:text-[11px] sm:leading-snug"
                        >
                            {appointment.patient.name}
                        </Link>
                    </div>
                </div>
            ) : (
                /* Full (list view) */
                <div className="space-y-1 pl-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${modStyle.text}`}>
                            {format(start, "HH:mm")}
                            </span>
                            <span className="text-xs font-normal text-muted-foreground bg-background/50 px-1.5 rounded-sm">
                                {appointment.durationMinutes} min
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            {showQuickCheckIn ? (
                                <QuickCheckInButton
                                    status={appointment.status}
                                    patientId={appointment.patient.id}
                                    doctorId={appointment.doctor.id}
                                    serviceTypeId={appointment.serviceType?.id ?? null}
                                    hasCheckIn={appointment.hasCheckIn}
                                    variant="inline"
                                />
                            ) : null}
                            <div className="text-sm opacity-90 flex items-center gap-1.5 border px-2 py-0.5 rounded-full bg-background/50 shadow-sm">
                            {ServiceIcon && st ? (
                                <span
                                    className="flex items-center gap-1"
                                    style={{ color: st.timelineColorHex ?? undefined }}
                                    title={st.name}
                                >
                                    <ServiceIcon className="size-4 shrink-0" />
                                    <span className="text-xs font-medium max-w-[120px] truncate">
                                        {st.name}
                                    </span>
                                </span>
                            ) : (
                                modStyle.icon
                            )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-1 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm">
                            <User className="size-3.5 text-muted-foreground shrink-0" />
                            <Link
                                href={medicalRecordHref}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate font-semibold text-foreground/90 transition hover:underline focus-visible:underline"
                            >
                                {appointment.patient.name}
                            </Link>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="size-3.5 flex items-center justify-center shrink-0">👨‍⚕️</span>
                            <span className="truncate">{appointment.doctor.name}</span>
                        </div>
                        {appointment.serviceType && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {ServiceIcon && st ? (
                                    <ServiceIcon
                                        className="size-3.5 shrink-0"
                                        style={{ color: st.timelineColorHex ?? undefined }}
                                    />
                                ) : (
                                    <span className="size-3.5 flex items-center justify-center shrink-0">✦</span>
                                )}
                                <span className="truncate">{appointment.serviceType.name}</span>
                            </div>
                        )}
                        {!appointment.serviceType && appointment.specialty && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="size-3.5 flex items-center justify-center shrink-0">✦</span>
                                <span className="truncate">{appointment.specialty.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
