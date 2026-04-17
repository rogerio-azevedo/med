import {
    getAdminDashboardStats,
    getTodayAppointments,
} from "@/db/queries/dashboard";
import { DashboardLayoutHeader } from "@/components/dashboard/DashboardLayoutHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayScheduleList } from "@/components/dashboard/TodayScheduleList";
import {
    Calendar,
    CalendarDays,
    ClipboardCheck,
    FileText,
    FlaskConical,
    Scissors,
    Stethoscope,
    Users,
} from "lucide-react";
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
        <div className="flex flex-col gap-4">
            <DashboardLayoutHeader
                title="Dashboard"
                description="Visão geral da clínica"
                userName={userName}
            />

            {/* Stat Cards — 2 linhas em xl (4+4) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    description="Para hoje"
                    iconColorClass="text-violet-500"
                    iconBgClass="bg-violet-500/10"
                    href="/schedule"
                />
                <StatCard
                    title="Agendamentos Total"
                    value={stats.totalAppointments}
                    icon={Calendar}
                    description="Na clínica"
                    iconColorClass="text-sky-500"
                    iconBgClass="bg-sky-500/10"
                    href="/schedule"
                />
                <StatCard
                    title="Consultas"
                    value={stats.monthServiceRecords}
                    icon={ClipboardCheck}
                    description="Realizadas este mês"
                    iconColorClass="text-orange-500"
                    iconBgClass="bg-orange-500/10"
                />
                <StatCard
                    title="Cirurgias"
                    value={stats.monthSurgeries}
                    icon={Scissors}
                    description="Realizadas este mês"
                    iconColorClass="text-rose-500"
                    iconBgClass="bg-rose-500/10"
                />
                <StatCard
                    title="Exames"
                    value={stats.monthExams}
                    icon={FlaskConical}
                    description="Solicitações este mês"
                    iconColorClass="text-cyan-500"
                    iconBgClass="bg-cyan-500/10"
                />
                <StatCard
                    title="Orçamentos"
                    value={stats.monthProposals}
                    icon={FileText}
                    description="Criados este mês"
                    iconColorClass="text-amber-500"
                    iconBgClass="bg-amber-500/10"
                    href="/proposals"
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
