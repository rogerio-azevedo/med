import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export async function Sidebar() {
    const session = await auth();
    const user = session?.user;
    const isSuperAdmin = user?.role === "super_admin";

    return (
        <aside className="w-64 bg-card border-r flex flex-col h-full">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold tracking-tight">med.system</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                </Button>

                {isSuperAdmin && (
                    <div className="pt-4">
                        <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Admin
                        </h3>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/admin/clinics">Clinics</Link>
                        </Button>
                    </div>
                )}
            </nav>
            <div className="p-4 border-t">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user?.name?.[0] || "U"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
