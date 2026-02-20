import {
    getDoctorByUserId,
    getDoctorDashboardStats,
    getDoctorTodayAppointments,
} from "@/db/queries/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayScheduleList } from "@/components/dashboard/TodayScheduleList";
import { Users, CalendarDays, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface DoctorDashboardProps {
    clinicId: string;
    userId: string;
    userName?: string | null;
}

export async function DoctorDashboard({
    clinicId,
    userId,
    userName,
}: DoctorDashboardProps) {
    const doctor = await getDoctorByUserId(userId);

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
                <p>Perfil de médico não encontrado.</p>
                <p className="text-xs">Entre em contato com o administrador da clínica.</p>
            </div>
        );
    }

    const [stats, todayApts] = await Promise.all([
        getDoctorDashboardStats(clinicId, doctor.id),
        getDoctorTodayAppointments(clinicId, doctor.id),
    ]);

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meu Painel</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Seu resumo do dia
                    {userName ? ` • Olá, Dr. ${userName.split(" ")[0]}` : ""}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <StatCard
                    title="Meus Pacientes"
                    value={stats.totalPatients}
                    icon={Users}
                    description="Pacientes sob sua responsabilidade"
                    iconColorClass="text-emerald-500"
                    iconBgClass="bg-emerald-500/10"
                    href="/patients"
                />
                <StatCard
                    title="Consultas Hoje"
                    value={stats.todayAppointments}
                    icon={CalendarDays}
                    description="Agendamentos para hoje"
                    iconColorClass="text-violet-500"
                    iconBgClass="bg-violet-500/10"
                    href="/schedule"
                />
                <StatCard
                    title="Atendimentos"
                    value={stats.monthServiceRecords}
                    icon={ClipboardCheck}
                    description="Realizados este mês"
                    iconColorClass="text-orange-500"
                    iconBgClass="bg-orange-500/10"
                />
            </div>

            {/* Today Schedule */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-base font-semibold">
                        Minha Agenda de Hoje
                    </CardTitle>
                    <Link
                        href="/schedule"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                        Ver agenda completa →
                    </Link>
                </CardHeader>
                <CardContent>
                    <TodayScheduleList
                        appointments={todayApts}
                        showDoctor={false}
                        emptyMessage="Você não tem consultas agendadas para hoje."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
