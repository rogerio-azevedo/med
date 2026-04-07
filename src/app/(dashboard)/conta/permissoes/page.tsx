import { auth } from "@/auth";
import { getClinicUsers } from "@/services/clinics";
import { getAllClinicPermissions } from "@/services/permissions";
import { redirect } from "next/navigation";
import { PermissionsGrid } from "@/components/conta/PermissionsGrid";

export default async function PermissoesPage() {
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
    
    const [users, permissions] = await Promise.all([
        getClinicUsers(clinicId),
        getAllClinicPermissions(clinicId)
    ]);

    // Format uses
    const typedUsers = users.map(u => ({
        id: u.id,
        name: u.user.name,
        email: u.user.email,
        image: u.user.image,
        role: u.role,
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Permissões de Acesso</h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
                Configure as permissões granulares por tipo de funcionalidade para cada membro da clínica. Administradores possuem acesso total por padrão.
            </p>

            <PermissionsGrid 
                users={typedUsers} 
                permissions={permissions}
                currentClinicUserId={currentClinicUserId} 
            />
        </div>
    );
}
