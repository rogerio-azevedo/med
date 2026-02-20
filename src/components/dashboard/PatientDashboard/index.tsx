import {
    getPatientByUserId,
    getPatientDashboardStats,
    getPatientDoctors,
    getPatientAppointments,
} from "@/db/queries/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { DoctorCard } from "@/components/dashboard/DoctorCard";
import { ClipboardCheck, CalendarDays, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PatientDashboardProps {
    clinicId: string;
    userId: string;
    userName?: string | null;
}

type AppointmentStatus = "scheduled" | "confirmed" | "in_progress" | "done" | "cancelled" | "no_show";

const statusConfig: Record<AppointmentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    scheduled: { label: "Agendado", variant: "secondary" },
    confirmed: { label: "Confirmado", variant: "default" },
    in_progress: { label: "Em andamento", variant: "default" },
    done: { label: "Concluído", variant: "secondary" },
    cancelled: { label: "Cancelado", variant: "destructive" },
    no_show: { label: "Não compareceu", variant: "destructive" },
};

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export async function PatientDashboard({
    clinicId,
    userId,
    userName,
}: PatientDashboardProps) {
    const patient = await getPatientByUserId(userId);

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
                <p>Perfil de paciente não encontrado.</p>
                <p className="text-xs">Entre em contato com a clínica.</p>
            </div>
        );
    }

    const [stats, myDoctors, myAppointments] = await Promise.all([
        getPatientDashboardStats(clinicId, patient.id),
        getPatientDoctors(clinicId, patient.id),
        getPatientAppointments(clinicId, patient.id),
    ]);

    const nextApt = stats.nextAppointment;

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Acompanhe sua saúde
                    {userName ? ` • Olá, ${userName.split(" ")[0]}` : ""}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Meus Médicos"
                    value={myDoctors.length}
                    icon={ClipboardCheck}
                    description="Médicos acompanhando você"
                    iconColorClass="text-blue-500"
                    iconBgClass="bg-blue-500/10"
                />
                <StatCard
                    title="Total de Atendimentos"
                    value={stats.totalServiceRecords}
                    icon={ClipboardCheck}
                    description="Consultas realizadas"
                    iconColorClass="text-emerald-500"
                    iconBgClass="bg-emerald-500/10"
                />
                <Card className="sm:col-span-2 lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Próxima Consulta
                                </p>
                                {nextApt ? (
                                    <>
                                        <p className="text-lg font-bold tabular-nums">
                                            {formatDateTime(nextApt.scheduledAt)}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            Dr. {nextApt.doctorName}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Nenhuma consulta agendada
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-center rounded-full p-3 shrink-0 bg-teal-500/10">
                                <CalendarDays className="size-5 text-teal-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* My Doctors */}
            {myDoctors.length > 0 && (
                <div className="flex flex-col gap-4">
                    <h2 className="text-base font-semibold">Meus Médicos</h2>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {myDoctors.map((doc) => (
                            <DoctorCard key={doc.doctorId} {...doc} />
                        ))}
                    </div>
                </div>
            )}

            {/* Appointment History */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                        Minhas Consultas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {myAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                            <Calendar className="size-10 opacity-30" />
                            <p className="text-sm">Nenhuma consulta encontrada.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y">
                            {myAppointments.map((apt) => {
                                const statusKey = apt.status as AppointmentStatus | null;
                                const status = statusKey ? statusConfig[statusKey] : null;
                                return (
                                    <div
                                        key={apt.id}
                                        className="flex items-center gap-4 py-3 hover:bg-muted/40 rounded-lg px-2 transition-colors"
                                    >
                                        <div className="flex items-center justify-center rounded-full p-2 bg-muted shrink-0">
                                            <Clock className="size-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                Dr. {apt.doctorName ?? "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(apt.scheduledAt)} • {apt.durationMinutes}min
                                            </p>
                                        </div>
                                        {status && (
                                            <UiBadge variant={status.variant} className="text-xs shrink-0">
                                                {status.label}
                                            </UiBadge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
