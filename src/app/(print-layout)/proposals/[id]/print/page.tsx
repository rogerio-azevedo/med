import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { getProposalPrintContext } from "@/db/queries/proposals/print-context";
import { ProposalDocument } from "@/app/(dashboard)/proposals/_components/proposal-document";
import { ProposalPrintAutoTrigger } from "@/app/(dashboard)/proposals/_components/proposal-print-auto-trigger";

interface ProposalPrintPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: string }>;
}

export default async function ProposalPrintPage({ params, searchParams }: ProposalPrintPageProps) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("proposals", "can_read");
    if (!allowed) {
        redirect("/dashboard");
    }

    const [{ id }, { mode }] = await Promise.all([params, searchParams]);
    const data = await getProposalPrintContext(id, clinicId);

    if (!data) {
        notFound();
    }

    const isPdfMode = mode === "pdf";

    return (
        <div className="px-4 py-8 print:px-0 print:py-0 md:px-8">
            <ProposalPrintAutoTrigger />

            <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm print:hidden">
                {isPdfMode
                    ? "A impressão foi aberta: use “Salvar como PDF” no diálogo do navegador."
                    : "A impressão foi aberta. Ajuste papel e margens se necessário."}
            </div>

            <ProposalDocument data={data} />
        </div>
    );
}
