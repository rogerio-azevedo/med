import {
    getDoctorByUserId,
    getDoctorDashboardStats,
    getDoctorTodayAppointments,
} from "@/db/queries/dashboard";
import { getWaitingConsultationsForClinic } from "@/db/queries/consultations";
import { getWaitingSurgeriesForClinic } from "@/db/queries/surgeries";
import { WaitingEncountersBanner } from "@/components/medical-records/WaitingEncountersBanner";
import { DashboardLayoutHeader } from "@/components/dashboard/DashboardLayoutHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayScheduleList } from "@/components/dashboard/TodayScheduleList";
import {
    CalendarDays,
    ClipboardCheck,
    FileText,
    FlaskConical,
    RefreshCw,
    Scissors,
    Users,
} from "lucide-react";
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

    const [stats, todayApts, waitingConsultations, waitingSurgeries] = await Promise.all([
        getDoctorDashboardStats(clinicId, doctor.id),
        getDoctorTodayAppointments(clinicId, doctor.id),
        getWaitingConsultationsForClinic(clinicId, doctor.id),
        getWaitingSurgeriesForClinic(clinicId, doctor.id),
    ]);

    const waitingEncounters = [...waitingConsultations, ...waitingSurgeries].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return (
        <div className="flex flex-col gap-4">
            <DashboardLayoutHeader
                title="Meu Painel"
                description="Seu resumo do dia"
                userName={userName}
                doctorGreeting
            />

            <WaitingEncountersBanner items={waitingEncounters} />

            {/* Stat Cards — 2 linhas em xl (5+2) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    title="Meus Pacientes"
                    value={stats.totalPatients}
                    icon={Users}
                    description="Sob sua responsabilidade"
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
                    title="Retornos"
                    value={stats.monthReturns}
                    icon={RefreshCw}
                    description="Realizados este mês"
                    iconColorClass="text-teal-500"
                    iconBgClass="bg-teal-500/10"
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
                    description="Criados por você este mês"
                    iconColorClass="text-amber-500"
                    iconBgClass="bg-amber-500/10"
                    href="/proposals"
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
