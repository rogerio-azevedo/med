"use client";

import { useLayoutEffect } from "react";
import { useHeaderStore } from "@/store/header";
import { ProposalDialog } from "./proposal-dialog";

type ProposalsListHeadingProps = {
    patients: { id: string; name: string }[];
    products: { id: string; name: string; sellingPrice: number; type: string }[];
    paymentTerms: { id: string; name: string; paymentMethod: string; description: string | null }[];
};

export function ProposalsListHeading({
    patients,
    products,
    paymentTerms,
}: ProposalsListHeadingProps) {
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    useLayoutEffect(() => () => clearHeader(), [clearHeader]);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
                <h1 className="bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                    Orçamentos e Propostas
                </h1>
                <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                    Gerencie o funil de vendas e rastreabilidade da clínica.
                </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
                <ProposalDialog patients={patients} products={products} paymentTerms={paymentTerms} />
            </div>
        </div>
    );
}
