import { MedicalDocumentHeader } from "./MedicalDocumentHeader";
import { MedicalDocumentBody } from "./MedicalDocumentBody";
import { MedicalDocumentSignatureBlock } from "./MedicalDocumentSignatureBlock";
import { MedicalDocumentFooter } from "./MedicalDocumentFooter";
import type { MedicalDocumentPrintShellProps } from "@/lib/medical-document/print-layout-types";

export type { MedicalDocumentPrintShellProps } from "@/lib/medical-document/print-layout-types";

export function MedicalDocumentPrintShell({
    doctor,
    clinic,
    documentTitle,
    renderedContentHtml,
    hideDocumentTitle,
    issuedAtLine,
    signatureImageUrl,
}: MedicalDocumentPrintShellProps) {
    return (
        <div className="mx-auto max-w-[21cm] bg-white px-6 py-8 font-sans text-black print:max-w-none print:bg-transparent print:px-0 print:py-0 md:px-10 md:py-10">
            <MedicalDocumentHeader doctor={doctor} clinic={clinic} />
            <MedicalDocumentBody
                documentTitle={documentTitle}
                renderedContentHtml={renderedContentHtml}
                hideDocumentTitle={hideDocumentTitle}
            />
            <MedicalDocumentSignatureBlock
                doctor={doctor}
                signatureImageUrl={signatureImageUrl}
                issuedAtLine={issuedAtLine}
            />
            <MedicalDocumentFooter clinic={clinic} />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        @media print {
          body { background: white; }
          @page { margin: 2cm; size: A4; }
        }
      `,
                }}
            />
        </div>
    );
}
