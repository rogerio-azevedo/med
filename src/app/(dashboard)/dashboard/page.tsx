import { auth } from "@/auth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { role, clinicId, id: userId, name } = session.user;

    // Admin or SuperAdmin: full clinic overview
    if (role === "admin" || role === "super_admin") {
        if (!clinicId) {
            // super_admin sem clinic ainda — fallback simples
            return (
                <div className="p-8">
                    <h1 className="text-2xl font-bold">Dashboard SuperAdmin</h1>
                    <p className="text-muted-foreground mt-2">
                        Nenhuma clínica associada. Acesse{" "}
                        <a href="/admin/clinics" className="underline">
                            Clínicas
                        </a>{" "}
                        para gerenciar.
                    </p>
                </div>
            );
        }
        return <AdminDashboard clinicId={clinicId} userName={name} />;
    }

    // Doctor: own patients & schedule
    if (role === "doctor") {
        if (!clinicId || !userId) redirect("/login");
        return (
            <DoctorDashboard clinicId={clinicId} userId={userId} userName={name} />
        );
    }

    // Patient: own doctors, appointments, history
    if (role === "patient") {
        if (!clinicId || !userId) redirect("/login");
        return (
            <PatientDashboard clinicId={clinicId} userId={userId} userName={name} />
        );
    }

    // Fallback for receptionist / nurse — show admin-like overview
    if (clinicId) {
        return <AdminDashboard clinicId={clinicId} userName={name} />;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
                Sem clínica associada. Entre em contato com o administrador.
            </p>
        </div>
    );
}
