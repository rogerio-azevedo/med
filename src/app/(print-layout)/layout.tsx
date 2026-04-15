import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Layout enxuto para páginas de impressão/PDF (sem sidebar nem cabeçalho do dashboard).
 */
export default async function PrintLayout({ children }: { children: ReactNode }) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return <div className="min-h-screen bg-slate-100 print:bg-white">{children}</div>;
}
