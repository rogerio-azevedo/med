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
        <div className="medical-doc-print-shell mx-auto max-w-[21cm] bg-white px-6 py-8 font-sans text-black print:max-w-none print:bg-transparent print:px-0 print:py-0 md:px-10 md:py-10">
            <MedicalDocumentHeader doctor={doctor} clinic={clinic} />
            <div className="flex min-h-0 flex-1 flex-col">
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
            </div>
            <MedicalDocumentFooter clinic={clinic} />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        /*
         * Margens @page (A4): topo menor para o cabeçalho subir; laterais/base com respiro.
         * Manter coerente com min-height: 297mm − margemTopo − margemBase.
         */
        @page {
          margin: 12mm 15mm 15mm 15mm;
          size: A4;
        }
        .medical-doc-print-shell {
          min-height: calc(297mm - 12mm - 15mm);
          display: flex;
          flex-direction: column;
        }
        @media print {
          body { background: white; }
        }
      `,
                }}
            />
        </div>
    );
}
