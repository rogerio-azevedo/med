import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { startOfWeek, endOfWeek } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { getAppointmentsByClinic } from "@/services/appointments";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getDoctorByUserId } from "@/db/queries/dashboard";
import { getWaitingConsultationsForClinic } from "@/db/queries/consultations";
import { getWaitingSurgeriesForClinic } from "@/db/queries/surgeries";
import { WaitingEncountersBanner } from "@/components/medical-records/WaitingEncountersBanner";
import { specialties as specialtiesTable } from "@/db/schema/medical";
import { db } from "@/db";

export const metadata = {
    title: "Agenda | Med",
    description: "Gerencie os agendamentos de consultas e atendimentos",
};

export default async function SchedulePage() {
    const session = await auth();
    if (!session?.user?.clinicId) redirect("/login");

    const allowed = await can("schedule", "can_read");
    if (!allowed) redirect("/dashboard");

    const clinicId = session.user.clinicId;

    // Buscar dados iniciais: semana atual
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const doctorProfile =
        session.user.id && session.user.role === "doctor"
            ? await getDoctorByUserId(session.user.id)
            : null;

    const [rawAppointments, doctors, patients, specialties, waitingConsultations, waitingSurgeries] =
        await Promise.all([
            getAppointmentsByClinic(clinicId, {
                startDate: weekStart,
                endDate: weekEnd,
            }),
            getDoctorsSimple(clinicId),
            getPatientsByClinic(clinicId),
            db.select().from(specialtiesTable),
            doctorProfile ? getWaitingConsultationsForClinic(clinicId, doctorProfile.id) : Promise.resolve([]),
            doctorProfile ? getWaitingSurgeriesForClinic(clinicId, doctorProfile.id) : Promise.resolve([]),
        ]);

    const waitingEncounters = [...waitingConsultations, ...waitingSurgeries].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

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
            <PageHeader
                title="Agenda"
                description="Gerencie consultas, atendimentos e exames"
            />

            {doctorProfile ? <WaitingEncountersBanner items={waitingEncounters} /> : null}

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
