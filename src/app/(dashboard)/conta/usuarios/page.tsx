import { auth } from "@/auth";
import { getClinicUsers } from "@/services/clinics";
import { redirect } from "next/navigation";
import { ClinicUsersTable } from "@/components/conta/ClinicUsersTable";

export default async function UsuariosPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    if (session.user.clinicRole !== "admin" && session.user.role !== "super_admin") {
        redirect("/dashboard");
    }

    const clinicId = session.user.clinicId;
    
    if (!clinicId) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Você não está vinculado a nenhuma clínica.
            </div>
        );
    }

    const currentClinicUserId = session.user.clinicUserId as string;
    const users = await getClinicUsers(clinicId);

    // Cast users array properly matching the interface in the component
    const typedUsers = users.map(u => ({
        id: u.id,
        clinicId: u.clinicId,
        role: u.role,
        isActive: u.isActive,
        user: {
            id: u.user.id,
            name: u.user.name,
            email: u.user.email,
            image: u.user.image,
        }
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Usuários da Clínica</h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
                Gerencie os usuários e seus papéis dentro da clínica.
            </p>

            <ClinicUsersTable 
                users={typedUsers} 
                currentClinicUserId={currentClinicUserId} 
            />
        </div>
    );
}
