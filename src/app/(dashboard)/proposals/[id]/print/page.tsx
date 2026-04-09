import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getProposalById } from "@/db/queries/proposals";
import { ProposalDocument } from "../../_components/proposal-document";
import { ProposalPrintAutoTrigger } from "../../_components/proposal-print-auto-trigger";

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

    const [{ id }, { mode }] = await Promise.all([params, searchParams]);
    const proposal = await getProposalById(id, clinicId);

    if (!proposal) {
        notFound();
    }

    const isPdfMode = mode === "pdf";

    return (
        <div className="min-h-screen bg-slate-100 px-6 py-8 print:bg-white print:px-0 print:py-0">
            <ProposalPrintAutoTrigger />

            <div className="mx-auto mb-6 max-w-4xl rounded-2xl border bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm print:hidden">
                {isPdfMode
                    ? "A janela de impressão foi aberta para você salvar esta proposta como PDF."
                    : "A janela de impressão foi aberta para você imprimir esta proposta."}
            </div>

            <ProposalDocument proposal={proposal} />
        </div>
    );
}
