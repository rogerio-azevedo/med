"use client";

import { useLayoutEffect } from "react";
import { useHeaderStore } from "@/store/header";
import { ProposalDialog } from "./proposal-dialog";

type ProposalsPageHeaderProps = {
    patients: { id: string; name: string }[];
    products: { id: string; name: string; sellingPrice: number; type: string }[];
    paymentTerms: { id: string; name: string; paymentMethod: string; description: string | null }[];
};

export function ProposalsPageHeader({ patients, products, paymentTerms }: ProposalsPageHeaderProps) {
    const setHeader = useHeaderStore((s) => s.setHeader);
    const setToolbar = useHeaderStore((s) => s.setToolbar);
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    useLayoutEffect(() => {
        setHeader("Orçamentos e Propostas", "Gerencie o funil de vendas e rastreabilidade da clínica.");
        return () => clearHeader();
    }, [setHeader, clearHeader]);

    useLayoutEffect(() => {
        setToolbar(
            <ProposalDialog patients={patients} products={products} paymentTerms={paymentTerms} />
        );
    }, [patients, products, paymentTerms, setToolbar]);

    return null;
}
