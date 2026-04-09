import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getProposalById } from "@/db/queries/proposals";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getProducts } from "@/db/queries/products";
import { getActivePaymentTerms } from "@/db/queries/payment-terms";
import { ProposalDetailClient } from "../_components/proposal-detail-client";

interface ProposalDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const { id } = await params;

    const [proposal, patients, products, paymentTerms] = await Promise.all([
        getProposalById(id, clinicId),
        getPatientsByClinic(clinicId),
        getProducts(clinicId),
        getActivePaymentTerms(clinicId),
    ]);

    if (!proposal) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <ProposalDetailClient
                proposal={proposal}
                patients={patients}
                products={products}
                paymentTerms={paymentTerms}
            />
        </div>
    );
}
