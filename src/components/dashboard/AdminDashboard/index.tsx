import {
    getAdminDashboardStats,
    getTodayAppointments,
} from "@/db/queries/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayScheduleList } from "@/components/dashboard/TodayScheduleList";
import { Stethoscope, Users, CalendarDays, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AdminDashboardProps {
    clinicId: string;
    userName?: string | null;
}

export async function AdminDashboard({ clinicId, userName }: AdminDashboardProps) {
    const [stats, todayApts] = await Promise.all([
        getAdminDashboardStats(clinicId),
        getTodayAppointments(clinicId),
    ]);

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Visão geral da clínica
                    {userName ? ` • Olá, ${userName.split(" ")[0]}` : ""}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total de Médicos"
                    value={stats.totalDoctors}
                    icon={Stethoscope}
                    description="Médicos ativos"
                    iconColorClass="text-blue-500"
                    iconBgClass="bg-blue-500/10"
                    href="/doctors"
                />
                <StatCard
                    title="Total de Pacientes"
                    value={stats.totalPatients}
                    icon={Users}
                    description="Pacientes cadastrados"
                    iconColorClass="text-emerald-500"
                    iconBgClass="bg-emerald-500/10"
                    href="/patients"
                />
                <StatCard
                    title="Agendamentos Hoje"
                    value={stats.todayAppointments}
                    icon={CalendarDays}
                    description={`${stats.totalAppointments} no total`}
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
                        Agenda de Hoje
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
                        showDoctor
                        emptyMessage="Nenhum agendamento para hoje."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
