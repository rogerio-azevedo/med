import { auth } from "@/auth";
import { getClinicUsers } from "@/services/clinics";
import { getAllClinicPermissions } from "@/services/permissions";
import { redirect } from "next/navigation";
import { PermissionsGrid } from "@/components/conta/PermissionsGrid";
import { PageHeader } from "@/components/shared/PageHeader";

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
        <div className="flex-1 space-y-8 p-8 pt-6">
            <PageHeader
                title="Permissões de Acesso"
                description="Configure as permissões granulares por tipo de funcionalidade para cada membro da clínica. Administradores possuem acesso total por padrão."
            />

            <PermissionsGrid 
                users={typedUsers} 
                permissions={permissions}
                currentClinicUserId={currentClinicUserId} 
            />
        </div>
    );
}
