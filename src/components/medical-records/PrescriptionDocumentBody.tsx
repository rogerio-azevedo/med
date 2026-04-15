import type { PrescriptionPrintItem } from "@/db/queries/prescriptions/print-context";
import { prescriptionItemFieldRows } from "./PrescriptionItemDetails";

const accent = "#5495D6";
const textDark = "#162333";

type PrescriptionDocumentBodyProps = {
    items: PrescriptionPrintItem[];
};

/**
 * Lista de medicamentos compartilhada entre receituário impresso e página de verificação.
 */
export function PrescriptionDocumentBody({ items }: PrescriptionDocumentBodyProps) {
    return (
        <ol className="m-0 list-none space-y-5 p-0 print:space-y-4">
            {items.map((item, i) => {
                const rows = prescriptionItemFieldRows(item);
                return (
                    <li
                        key={item.id}
                        className="break-inside-avoid border-b border-[#F3F3F3] pb-5 last:border-0 last:pb-0 print:pb-4"
                    >
                        <div className="flex gap-3">
                            <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white print:h-7 print:w-7 print:text-xs"
                                style={{ backgroundColor: accent }}
                            >
                                {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-base font-bold leading-snug" style={{ color: textDark }}>
                                    {item.medicineName}
                                </p>
                                {rows.length > 0 ? (
                                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm sm:grid-cols-4 print:grid-cols-4">
                                        {rows.map(({ label, value }) => (
                                            <div key={`${item.id}-${label}`} className="min-w-0">
                                                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                    {label}
                                                </dt>
                                                <dd className="mt-0.5 wrap-break-word text-slate-800">{value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : null}
                                {item.instructions?.trim() ? (
                                    <div
                                        className="mt-3 rounded-lg border px-3 py-2 text-sm print:border-slate-200"
                                        style={{ borderColor: "#F3F3F3", backgroundColor: "#F3F3F3" }}
                                    >
                                        <p className="text-[10px] font-semibold uppercase text-slate-500">
                                            Instruções ao paciente
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-slate-800">{item.instructions.trim()}</p>
                                    </div>
                                ) : null}
                                {item.isContinuous ? (
                                    <p className="mt-2 text-xs font-bold uppercase" style={{ color: textDark }}>
                                        Uso contínuo
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
