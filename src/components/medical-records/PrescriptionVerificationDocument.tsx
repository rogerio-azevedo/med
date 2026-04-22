import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PrescriptionPrintContext } from "@/db/queries/prescriptions/print-context";
import { PrescriptionClinicBanner } from "./PrescriptionClinicBanner";
import { PrescriptionDocumentBody } from "./PrescriptionDocumentBody";
import { PrescriptionQrCode } from "./PrescriptionQrCode";

const NAVY = "#162333";
const LIGHT = "#F3F3F3";
const ACCENT = "#5495D6";

type PrescriptionVerificationDocumentProps = {
    data: PrescriptionPrintContext;
    verifiedAt: Date;
};

export function PrescriptionVerificationDocument({ data, verifiedAt }: PrescriptionVerificationDocumentProps) {
    const when = format(data.consultationDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const verifiedWhen = format(verifiedAt, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

    return (
        <article
            className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            style={{ color: NAVY }}
        >
            <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-center print:px-4">
                <p className="text-sm font-semibold text-emerald-800">Receita verificada</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                    Consulta realizada em {when} · Verificação em {verifiedWhen}
                </p>
            </div>

            <PrescriptionClinicBanner
                clinicName={data.clinicName}
                clinicLogoUrl={data.clinicLogoUrl}
                clinicAddress={data.clinicAddress}
                clinicPhone={data.clinicPhone}
            />

            <div className="h-1 w-full" style={{ backgroundColor: ACCENT, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} aria-hidden />

            <div className="px-6 py-5 print:px-4 print:py-4" style={{ backgroundColor: LIGHT, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <h1 className="text-center text-sm font-bold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
                    Receituário médico
                </h1>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Paciente</dt>
                        <dd className="mt-0.5 font-semibold" style={{ color: NAVY }}>
                            {data.patientName}
                        </dd>
                        {data.patientDob ? (
                            <dd className="mt-0.5 text-slate-700">Nasc. {data.patientDob}</dd>
                        ) : null}
                    </div>
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            Data do atendimento
                        </dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">{when}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Prescritor</dt>
                        <dd className="mt-0.5 font-semibold" style={{ color: NAVY }}>
                            {data.doctorName ?? "—"}
                            {data.doctorCrmLine ? (
                                <span className="block font-normal text-slate-700 sm:inline sm:before:content-['\00a0·\00a0']">
                                    {data.doctorCrmLine}
                                </span>
                            ) : null}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="border-t border-slate-100 px-6 py-6 print:px-4 print:py-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Medicamentos prescritos</h2>
                <div className="mt-4">
                    <PrescriptionDocumentBody items={data.items} />
                </div>
            </div>

            <footer className="space-y-4 border-t border-slate-200 px-6 py-6 print:px-4 print:py-5">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-xs flex-1">
                        <div className="h-px w-52 border-t-2 border-slate-400" />
                        <p className="mt-2 text-xs text-slate-600">Assinatura e carimbo (quando aplicável)</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 sm:items-end">
                        <PrescriptionQrCode value={data.verificationUrl} />
                        {data.verificationUrl ? (
                            <p className="max-w-[200px] text-center text-[10px] leading-tight text-slate-600 sm:text-right">
                                QR Code de referência para esta receita.
                            </p>
                        ) : null}
                    </div>
                </div>
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
                    Esta receita foi emitida eletronicamente pelo sistema de gestão da clínica. A verificação confirma que os
                    dados exibidos correspondem ao registro do atendimento no momento da consulta.
                </p>
            </footer>
        </article>
    );
}
