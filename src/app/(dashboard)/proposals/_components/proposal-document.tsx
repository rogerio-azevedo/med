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

/** Fallback quando `clinics.proposal_general_notes` está vazio. */
export const DEFAULT_PROPOSAL_CONDITIONS_GENERAL_LINES = [
    "Orçamento válido por 15 dias",
    "No caso de complicações que necessitem período maior de internação, novo orçamento será apresentado, configurando-se gastos extras.",
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

            <div className="px-4 py-2 print:px-3 print:py-1.5" style={{ backgroundColor: LIGHT }}>
                <div className="text-center">
                    <h1 className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                        Proposta comercial
                        <span className="font-normal normal-case tracking-normal text-slate-600">
                            {" "}
                            · Nº {String(data.number).padStart(4, "0")} · Emitida em {created}
                        </span>
                    </h1>
                </div>
                <dl className="mt-1.5 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-2 sm:items-start print:gap-y-0.5">
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
                        <dd className="mt-px whitespace-pre-wrap font-medium leading-snug text-slate-800">
                            {data.proposalPaymentDisplay}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="border-t border-slate-100 px-4 py-4 print:px-3 print:py-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens do orçamento</h2>
                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 print:mt-1.5">
                    <table className="w-full text-sm print:text-xs">
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                <th className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:px-2 print:py-1">
                                    Item
                                </th>
                                <th className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:px-2 print:py-1">
                                    Qtd
                                </th>
                                <th className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:px-2 print:py-1">
                                    Unitário
                                </th>
                                <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:px-2 print:py-1">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item) => (
                                <tr key={item.id} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900 print:py-1">
                                        {item.description || item.productName || "Item sem descrição"}
                                    </td>
                                    <td className="px-2 py-2 text-slate-700 print:py-1">{item.quantity}</td>
                                    <td className="px-2 py-2 text-slate-700 print:py-1">
                                        {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="px-2 py-2 text-right font-semibold text-slate-900 print:py-1">
                                        {formatCurrency(item.totalPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-[1fr_minmax(0,220px)] print:gap-3 print:px-3 print:py-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 print:py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Observações</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-slate-700 print:text-xs print:leading-relaxed">
                        {data.notes || "Nenhuma observação registrada."}
                    </p>
                </div>
                <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2.5 print:py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor total</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-800 print:text-base">
                        {formatCurrency(data.totalAmount)}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-600 print:mt-1">
                        Elaborado por <span className="font-medium text-slate-800">{data.createdByName || "—"}</span>
                    </p>
                </div>
            </div>

            <section
                className="border-t border-slate-100 px-4 py-3 print:px-3 print:py-2 print:break-inside-avoid"
                aria-label="Observações da clínica"
            >
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 print:py-1.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Observações da clínica
                    </h3>
                    {data.proposalGeneralNotes?.trim() ? (
                        <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-snug text-slate-700 print:mt-1">
                            {data.proposalGeneralNotes.trim()}
                        </p>
                    ) : (
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-snug text-slate-700 print:mt-1 print:space-y-0.5">
                            {DEFAULT_PROPOSAL_CONDITIONS_GENERAL_LINES.map((line) => (
                                <li key={line}>{line}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <footer className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-end sm:justify-between print:gap-3 print:px-3 print:py-3">
                <div className="max-w-xs flex-1">
                    <div className="h-px w-52 border-t-2 border-slate-400" />
                    <p className="mt-1.5 text-xs text-slate-600 print:mt-1">Assinatura e carimbo (quando aplicável)</p>
                </div>
                <p className="text-right text-[10px] leading-tight text-slate-500 sm:max-w-[200px]">
                    Documento gerado eletronicamente. Conferir valores e condições antes da aceitação.
                </p>
            </footer>
        </article>
    );
}
