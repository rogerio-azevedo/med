import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface ProposalDocumentProps {
    proposal: {
        id: string;
        number: number;
        status: string;
        totalAmount: number;
        createdAt: Date;
        validUntil: string | null;
        notes: string | null;
        paymentTermLabel: string | null;
        patient: { name: string | null };
        createdBy: { name: string | null } | null;
        items: Array<{
            id: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            description: string | null;
            product: { name: string | null } | null;
        }>;
    };
}

const statusConfig: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviada",
    won: "Ganha",
    lost: "Perdida",
    cancelled: "Cancelada",
};

export function ProposalDocument({ proposal }: ProposalDocumentProps) {
    return (
        <div className="mx-auto w-full max-w-4xl rounded-3xl border bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <header className="flex flex-col gap-6 border-b pb-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Proposta Comercial</p>
                    <h1 className="text-3xl font-black text-slate-900">
                        #{String(proposal.number).padStart(4, "0")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Criada em {format(new Date(proposal.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>

                <div className="grid gap-3 text-sm md:text-right">
                    <div>
                        <p className="font-semibold text-slate-500">Paciente</p>
                        <p className="text-base font-bold text-slate-900">{proposal.patient?.name || "Não informado"}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-500">Status</p>
                        <p className="text-base font-bold text-slate-900">{statusConfig[proposal.status] || proposal.status}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-500">Validade</p>
                        <p className="text-base font-bold text-slate-900">
                            {proposal.validUntil
                                ? format(new Date(proposal.validUntil), "dd/MM/yyyy")
                                : "Não definida"}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-500">Forma de Pagamento</p>
                        <p className="text-base font-bold text-slate-900">
                            {proposal.paymentTermLabel || "Não definida"}
                        </p>
                    </div>
                </div>
            </header>

            <section className="mt-8">
                <div className="overflow-hidden rounded-2xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600">Item</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Qtd</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Unitário</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposal.items.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {item.description || item.product?.name || "Item sem descrição"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(item.totalPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
                <div className="rounded-2xl border bg-slate-50/60 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Observações</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {proposal.notes || "Nenhuma observação registrada."}
                    </p>
                </div>

                <div className="rounded-2xl border bg-primary/5 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary/70">Resumo Financeiro</p>
                    <p className="mt-3 text-sm text-slate-600">
                        Elaborado por {proposal.createdBy?.name || "Usuário não identificado"}.
                    </p>
                    <p className="mt-6 text-sm font-medium uppercase text-slate-500">Valor Total</p>
                    <p className="text-3xl font-black text-primary">{formatCurrency(proposal.totalAmount)}</p>
                </div>
            </section>
        </div>
    );
}
