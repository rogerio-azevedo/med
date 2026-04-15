import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PrescriptionPrintContext } from "@/db/queries/prescriptions/print-context";
import { prescriptionItemFieldRows } from "./PrescriptionItemDetails";

type PrescriptionDocumentProps = {
    data: PrescriptionPrintContext;
};

export function PrescriptionDocument({ data }: PrescriptionDocumentProps) {
    const when = format(data.consultationDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    return (
        <article className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <header className="border-b border-slate-200 pb-6 print:pb-4">
                <p className="text-center text-lg font-bold tracking-tight text-slate-900">{data.clinicName}</p>
                <h1 className="mt-2 text-center text-xl font-semibold text-slate-800">Receituário médico</h1>
                <dl className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paciente</dt>
                        <dd className="mt-0.5 font-medium">{data.patientName}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data do atendimento</dt>
                        <dd className="mt-0.5 font-medium">{when}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prescritor</dt>
                        <dd className="mt-0.5 font-medium">
                            {data.doctorName ?? "—"}
                            {data.doctorCrmLine ? (
                                <span className="block text-slate-600 sm:inline sm:before:content-['\00a0·\00a0']">
                                    {data.doctorCrmLine}
                                </span>
                            ) : null}
                        </dd>
                    </div>
                </dl>
            </header>

            <ol className="mt-6 list-none space-y-6 p-0 print:mt-4">
                {data.items.map((item, i) => {
                    const rows = prescriptionItemFieldRows(item);
                    return (
                        <li
                            key={item.id}
                            className="break-inside-avoid border-b border-slate-100 pb-6 last:border-0 last:pb-0 print:pb-4"
                        >
                            <p className="text-base font-bold text-slate-900">
                                {i + 1}. {item.medicineName}
                            </p>
                            {rows.length > 0 ? (
                                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                    {rows.map(({ label, value }) => (
                                        <div key={`${item.id}-${label}`}>
                                            <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                                            <dd className="mt-0.5 text-slate-800">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            ) : null}
                            {item.instructions?.trim() ? (
                                <div className="mt-3 rounded border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm print:bg-transparent">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Instruções ao paciente</p>
                                    <p className="mt-1 whitespace-pre-wrap text-slate-800">{item.instructions.trim()}</p>
                                </div>
                            ) : null}
                            {item.isContinuous ? (
                                <p className="mt-2 text-xs font-bold uppercase text-slate-700">Uso contínuo</p>
                            ) : null}
                        </li>
                    );
                })}
            </ol>

            <footer className="mt-10 border-t border-slate-200 pt-8 print:mt-8">
                <div className="h-px w-56 border-t border-slate-400" />
                <p className="mt-2 text-sm text-slate-600">Assinatura e carimbo (quando aplicável)</p>
            </footer>
        </article>
    );
}
