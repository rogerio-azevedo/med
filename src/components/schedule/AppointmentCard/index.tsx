"use client";

import { format } from "date-fns";
import { User } from "lucide-react";
import Link from "next/link";
import { resolveServiceTypeDisplayIcon } from "@/lib/resolve-service-type-display";

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
};

const statusColors: Record<AppointmentStatus, string> = {
    scheduled: "bg-blue-500",
    confirmed: "bg-teal-500",
    in_progress: "bg-amber-500",
    done: "bg-green-600",
    cancelled: "bg-slate-400",
    no_show: "bg-red-500",
};

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
}

export function AppointmentCard({
    appointment,
    onClick,
    style,
    compact = false,
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
            className={`group w-full text-left rounded-md border-l-4 transition-all cursor-pointer shadow-sm hover:shadow-md ${compact ? "p-0" : "pr-3 py-2"} ${statusColor.replace("bg-", "border-")} ${modStyle.bg}`}
        >
            {compact ? (
                /* Compact (calendar view) */
                <div className="relative flex h-full min-h-0 flex-col overflow-hidden px-2 py-1.5">
                    <div className="flex items-start justify-between gap-1">
                        <div className={`truncate text-[10px] font-bold leading-none sm:text-xs ${modStyle.text}`}>
                            {format(start, "HH:mm")}
                        </div>
                        <div className="shrink-0 text-[10px] leading-none opacity-80 flex items-center">
                            {ServiceIcon && st ? (
                                <span
                                    className="flex size-4 items-center justify-center rounded"
                                    style={{
                                        color: st.timelineColorHex ?? undefined,
                                    }}
                                    title={st.name}
                                >
                                    <ServiceIcon className="size-3.5" />
                                </span>
                            ) : (
                                modStyle.icon
                            )}
                        </div>
                    </div>
                    <Link
                        href={medicalRecordHref}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 truncate text-[10px] font-semibold leading-tight text-foreground/90 transition hover:underline focus-visible:underline sm:text-xs"
                    >
                        {appointment.patient.name}
                    </Link>
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
