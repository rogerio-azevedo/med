import { DOCUMENT_DEFAULT_LOGO_PATH } from "@/lib/constants/document-print";
import type { MedicalDocumentPrintClinic, MedicalDocumentPrintDoctor } from "@/lib/medical-document/print-layout-types";

type MedicalDocumentHeaderProps = {
    doctor: MedicalDocumentPrintDoctor | null;
    clinic: MedicalDocumentPrintClinic;
};

export function MedicalDocumentHeader({ doctor, clinic }: MedicalDocumentHeaderProps) {
    return (
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 print:border-slate-300">
            <div className="min-w-0 flex-1 text-sm leading-snug text-black">
                {doctor ? (
                    <>
                        <p className="text-base font-bold leading-tight">{doctor.displayName}</p>
                        {doctor.specialtyLine ? (
                            <p className="mt-1 text-[13px] font-normal">{doctor.specialtyLine}</p>
                        ) : null}
                        {doctor.crmLine ? <p className="mt-1 text-[13px] font-normal">{doctor.crmLine}</p> : null}
                    </>
                ) : (
                    <p className="text-sm text-slate-600">Emitente não identificado como médico no sistema.</p>
                )}
            </div>
            <div className="flex shrink-0 max-w-[55%] items-center justify-end text-right">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={clinic.logoUrl?.trim() || DOCUMENT_DEFAULT_LOGO_PATH}
                    alt=""
                    className="h-12 w-auto max-h-14 object-contain object-right print:h-13"
                    style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                />
            </div>
        </header>
    );
}
