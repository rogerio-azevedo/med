import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { getGeneratedDocumentPrintContext } from "@/db/queries/document-templates/print-context";
import { PrintDocumentView } from "@/components/document-templates/PrintDocumentView";
import { DocumentPrintModeBanner } from "@/components/document-templates/DocumentPrintModeBanner";

export default async function DocumentTemplatePrintPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ docId?: string; mode?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        redirect("/login");
    }

    const allowed = await can("document-templates", "can_read");
    if (!allowed) {
        redirect("/dashboard");
    }

    const [{ id: templateId }, { docId, mode }] = await Promise.all([params, searchParams]);
    if (!docId) {
        return (
            <div className="p-8 text-center text-sm text-slate-600">
                Parâmetro docId é obrigatório para imprimir o documento.
            </div>
        );
    }

    const context = await getGeneratedDocumentPrintContext(docId, templateId, session.user.clinicId);
    if (!context) {
        notFound();
    }

    const printMode = mode === "pdf" ? "pdf" : "print";

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 print:bg-transparent print:p-0 md:px-8">
            <DocumentPrintModeBanner mode={printMode} />
            <PrintDocumentView context={context} />
        </div>
    );
}
