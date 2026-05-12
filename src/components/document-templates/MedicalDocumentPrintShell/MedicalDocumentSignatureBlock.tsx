import type { MedicalDocumentPrintDoctor } from "@/lib/medical-document/print-layout-types";

type MedicalDocumentSignatureBlockProps = {
    doctor: MedicalDocumentPrintDoctor | null;
    signatureImageUrl: string | null;
    issuedAtLine: string;
};

export function MedicalDocumentSignatureBlock({
    doctor,
    signatureImageUrl,
    issuedAtLine,
}: MedicalDocumentSignatureBlockProps) {
    return (
        <section className="mt-8 print:mt-10">
            <p className="mb-8 text-left text-sm text-black print:mb-6">{issuedAtLine}</p>

            <div className="flex flex-col items-center text-center">
                <div className="flex min-h-[72px] w-full max-w-xs items-center justify-center print:min-h-[64px]">
                    {signatureImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={signatureImageUrl}
                            alt=""
                            className="max-h-20 w-auto object-contain object-center"
                            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                        />
                    ) : (
                        <div className="h-px w-56 border-b border-slate-400 print:w-52" aria-hidden />
                    )}
                </div>
                <div className="mt-2 space-y-0.5 text-sm">
                    <p className="font-semibold">{doctor?.displayName ?? "Assinatura"}</p>
                    {doctor?.crmLine ? <p className="text-[13px] text-slate-800">{doctor.crmLine}</p> : null}
                </div>
            </div>
        </section>
    );
}
