import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { getPrescriptionPrintContext } from "@/db/queries/prescriptions/print-context";
import { PrescriptionDocument } from "@/components/medical-records/PrescriptionDocument";
import { PrescriptionPrintAutoTrigger } from "@/components/medical-records/PrescriptionPrintAutoTrigger";

interface PrescriptionPrintPageProps {
    params: Promise<{ consultationId: string }>;
    searchParams: Promise<{ patientId?: string; mode?: string }>;
}

export default async function PrescriptionPrintPage({ params, searchParams }: PrescriptionPrintPageProps) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("medical-records", "can_read");
    if (!allowed) {
        redirect("/dashboard");
    }

    const [{ consultationId }, { patientId, mode }] = await Promise.all([params, searchParams]);
    if (!patientId) {
        notFound();
    }

    const data = await getPrescriptionPrintContext(consultationId, patientId, clinicId);
    if (!data) {
        notFound();
    }

    const isPdfMode = mode === "pdf";

    return (
        <div className="px-4 py-8 print:px-0 print:py-0 md:px-8">
            <PrescriptionPrintAutoTrigger />

            <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm print:hidden">
                {isPdfMode
                    ? "A impressão foi aberta: use “Salvar como PDF” no diálogo do navegador."
                    : "A impressão foi aberta. Ajuste papel e margens se necessário."}
            </div>

            <PrescriptionDocument data={data} />
        </div>
    );
}
