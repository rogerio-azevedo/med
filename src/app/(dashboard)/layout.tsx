import { AppSidebar } from "@/components/shared/Sidebar/app-sidebar";
import { Header } from "@/components/shared/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { getSidebarNavAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const sidebarNav = await getSidebarNavAccess();

    return (
        <SidebarProvider>
            <AppSidebar
                user={session.user}
                mainNavAllowedPaths={sidebarNav.mainPaths}
                adminClinicAllowedPaths={sidebarNav.adminClinicPaths}
            />
            <SidebarInset>
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

