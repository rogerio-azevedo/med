import type { ReactNode } from "react";

/**
 * Layout público para verificação de receita (sem login).
 */
export default function VerifyLayout({ children }: { children: ReactNode }) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
}
