import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProposalPrintContext } from "@/db/queries/proposals/print-context";
import { PrescriptionClinicBanner } from "@/components/medical-records/PrescriptionClinicBanner";
import { formatCurrency } from "@/lib/utils";

const NAVY = "#162333";
const LIGHT = "#F3F3F3";
const ACCENT = "#5495D6";

type ProposalDocumentProps = {
    data: ProposalPrintContext;
};

const statusConfig: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviada",
    won: "Ganha",
    lost: "Perdida",
    cancelled: "Cancelada",
};

/** Fallback quando `clinics.proposal_conditions` está vazio (exportado para reutilização futura). */
export const DEFAULT_PROPOSAL_CONDITIONS_GENERAL_LINES = [
    "Orçamento válido por 15 dias",
    "No caso de complicações que necessitem período maior de internação, novo orçamento será apresentado, configurando-se gastos extras.",
] as const;

export const DEFAULT_PROPOSAL_PAYMENT_LINES = [
    "Banco Unicred · Ag. 2301 · CC 377970",
    "PIX CNPJ - 46.072.065/0001-43",
    "No caso de parcelamento no cartão de crédito, o valor está sujeito a juros da plataforma de pagamento.",
] as const;

export function ProposalDocument({ data }: ProposalDocumentProps) {
    const created = format(new Date(data.createdAt), "dd/MM/yyyy", { locale: ptBR });
    const validUntilLabel = data.validUntil
        ? format(new Date(data.validUntil), "dd/MM/yyyy", { locale: ptBR })
        : "Não definida";

    return (
        <article
            className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
            style={{ color: NAVY }}
        >
            <PrescriptionClinicBanner
                compact
                clinicName={data.clinicName}
                clinicLogoUrl={data.clinicLogoUrl}
                clinicAddress={data.clinicAddress}
                clinicPhone={data.clinicPhone}
            />

            <div className="h-0.5 w-full print:h-px" style={{ backgroundColor: ACCENT }} aria-hidden />

            <div className="px-4 py-2.5 print:px-3 print:py-2" style={{ backgroundColor: LIGHT }}>
                <div className="text-center">
                    <h1 className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                        Proposta comercial
                        <span className="font-normal normal-case tracking-normal text-slate-600">
                            {" "}
                            · Nº {String(data.number).padStart(4, "0")} · Emitida em {created}
                        </span>
                    </h1>
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                    <div className="min-w-0">
                        <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Paciente</dt>
                        <dd className="mt-px font-medium leading-tight" style={{ color: NAVY }}>
                            {data.patientName || "Não informado"}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                        <dd className="mt-px font-medium leading-tight text-slate-800">
                            {statusConfig[data.status] ?? data.status}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Validade</dt>
                        <dd className="mt-px font-medium leading-tight text-slate-800">{validUntilLabel}</dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                            Forma de pagamento
                        </dt>
                        <dd className="mt-px font-medium leading-tight text-slate-800">
                            {data.paymentTermLabel || "Não definida"}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="border-t border-slate-100 px-6 py-6 print:px-4 print:py-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens do orçamento</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:py-2">
                                    Item
                                </th>
                                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:py-2">
                                    Qtd
                                </th>
                                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:py-2">
                                    Unitário
                                </th>
                                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:py-2">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item) => (
                                <tr key={item.id} className="border-t border-slate-100">
                                    <td className="px-3 py-3 font-medium text-slate-900 print:py-2">
                                        {item.description || item.productName || "Item sem descrição"}
                                    </td>
                                    <td className="px-3 py-3 text-slate-700 print:py-2">{item.quantity}</td>
                                    <td className="px-3 py-3 text-slate-700 print:py-2">
                                        {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-semibold text-slate-900 print:py-2">
                                        {formatCurrency(item.totalPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-6 border-t border-slate-100 px-6 py-6 sm:grid-cols-[1fr_minmax(0,220px)] print:px-4 print:py-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Observações</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {data.notes || "Nenhuma observação registrada."}
                    </p>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor total</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-800">
                        {formatCurrency(data.totalAmount)}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                        Elaborado por <span className="font-medium text-slate-800">{data.createdByName || "—"}</span>
                    </p>
                </div>
            </div>

            <section
                className="border-t border-slate-100 px-6 py-5 print:px-4 print:py-4 print:break-inside-avoid"
                aria-label="Condições gerais e informações para pagamento"
            >
                {data.proposalConditions?.trim() ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                            {data.proposalConditions.trim()}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Condições gerais
                            </h3>
                            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-slate-700">
                                {DEFAULT_PROPOSAL_CONDITIONS_GENERAL_LINES.map((line) => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Informações para pagamento
                            </h3>
                            <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-slate-700">
                                {DEFAULT_PROPOSAL_PAYMENT_LINES.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <footer className="flex flex-col gap-6 border-t border-slate-200 px-6 py-6 sm:flex-row sm:items-end sm:justify-between print:px-4 print:py-5">
                <div className="max-w-xs flex-1">
                    <div className="h-px w-52 border-t-2 border-slate-400" />
                    <p className="mt-2 text-xs text-slate-600">Assinatura e carimbo (quando aplicável)</p>
                </div>
                <p className="text-right text-[10px] leading-tight text-slate-500 sm:max-w-[200px]">
                    Documento gerado eletronicamente. Conferir valores e condições antes da aceitação.
                </p>
            </footer>
        </article>
    );
}
