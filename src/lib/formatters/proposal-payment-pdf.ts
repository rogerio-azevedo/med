import type { getProposalById } from "@/db/queries/proposals";

const PAYMENT_METHOD_PT: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de crédito",
    debit_card: "Cartão de débito",
    boleto: "Boleto",
    cash: "Dinheiro",
};

type ProposalWithPayment = NonNullable<Awaited<ReturnType<typeof getProposalById>>>;

/**
 * Texto exibido no PDF na seção "Condição de pagamento", a partir da própria proposta
 * (rótulo salvo + prazo de pagamento cadastrado, quando houver).
 */
export function buildProposalPaymentDisplayText(proposal: ProposalWithPayment): string {
    const label =
        proposal.paymentTermLabel?.trim() || proposal.paymentTerm?.name?.trim() || "";
    if (!label) {
        return "Não definida.";
    }

    const lines: string[] = [label];
    const rawMethod = proposal.paymentTerm?.paymentMethod;
    if (rawMethod) {
        const pt = PAYMENT_METHOD_PT[rawMethod] ?? rawMethod;
        lines.push(`Modalidade: ${pt}`);
    }
    const desc = proposal.paymentTerm?.description?.trim();
    if (desc) {
        lines.push(desc);
    }
    return lines.join("\n");
}
