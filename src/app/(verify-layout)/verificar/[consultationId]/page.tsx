import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PrescriptionVerificationDocument } from "@/components/medical-records/PrescriptionVerificationDocument";
import { getPrescriptionVerificationContext } from "@/db/queries/prescriptions/print-context";

interface VerifyPrescriptionPageProps {
    params: Promise<{ consultationId: string }>;
}

export default async function VerifyPrescriptionPage({ params }: VerifyPrescriptionPageProps) {
    const { consultationId } = await params;

    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const requestOrigin = host ? `${proto}://${host}` : null;

    const data = await getPrescriptionVerificationContext(consultationId, { requestOrigin });
    if (!data) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
            <PrescriptionVerificationDocument data={data} verifiedAt={new Date()} />
        </div>
    );
}
