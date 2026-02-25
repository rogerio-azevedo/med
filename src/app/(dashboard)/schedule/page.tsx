import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { startOfWeek, endOfWeek } from "date-fns";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { getAppointmentsByClinic } from "@/services/appointments";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { getPatientsByClinic } from "@/db/queries/patients";
import { specialties as specialtiesTable } from "@/db/schema/medical";
import { db } from "@/db";

export const metadata = {
    title: "Agenda | Med",
    description: "Gerencie os agendamentos de consultas e atendimentos",
};

export default async function SchedulePage() {
    const session = await auth();
    if (!session?.user?.clinicId) redirect("/login");

    const clinicId = session.user.clinicId;

    // Buscar dados iniciais: semana atual
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [rawAppointments, doctors, patients, specialties] = await Promise.all([
        getAppointmentsByClinic(clinicId, {
            startDate: weekStart,
            endDate: weekEnd,
        }),
        getDoctorsSimple(clinicId),
        getPatientsByClinic(clinicId),
        db.select().from(specialtiesTable),
    ]);

    // Mapear para o formato esperado pelos componentes
    const appointments = rawAppointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt,
        durationMinutes: a.durationMinutes,
        modality: a.modality,
        status: a.status ?? "scheduled",
        notes: a.notes,
        doctor: { id: a.doctor.id, name: a.doctor.name ?? null },
        patient: { id: a.patient.id, name: a.patient.name, phone: a.patient.phone },
        specialty: a.specialty?.id ? { id: a.specialty.id, name: a.specialty.name } : null,
    }));

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
                <p className="text-muted-foreground text-sm">
                    Gerencie consultas, atendimentos e exames
                </p>
            </div>

            <ScheduleView
                appointments={appointments as Parameters<typeof ScheduleView>[0]["appointments"]}
                doctors={doctors}
                patients={patients.map((p) => ({
                    id: p.id,
                    name: p.name,
                    phone: p.phone ?? null,
                }))}
                specialties={specialties}
            />
        </div>
    );
}
