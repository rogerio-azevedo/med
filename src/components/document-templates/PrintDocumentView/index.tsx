"use client";

import { useEffect, useState } from "react";
import { MedicalDocumentPrintShell } from "@/components/document-templates/MedicalDocumentPrintShell";
import { medicalDocumentPrintSignatureKey } from "@/lib/constants/medical-document-print-storage";
import type { GeneratedDocumentPrintContext } from "@/db/queries/document-templates/print-context";

type PrintDocumentViewProps = {
    context: GeneratedDocumentPrintContext;
};

export function PrintDocumentView({ context }: PrintDocumentViewProps) {
    const [ephemeralSignatureDataUrl, setEphemeralSignatureDataUrl] = useState<string | null>(null);

    useEffect(() => {
        const key = medicalDocumentPrintSignatureKey(context.document.id);
        const t = window.setTimeout(() => {
            try {
                const raw = sessionStorage.getItem(key);
                if (raw) {
                    setEphemeralSignatureDataUrl(raw);
                    sessionStorage.removeItem(key);
                }
            } catch {
                /* private mode etc. */
            }
        }, 0);
        return () => clearTimeout(t);
    }, [context.document.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const savedSig = context.doctor?.signatureImageUrl ?? null;
    const signatureImageUrl = ephemeralSignatureDataUrl ?? savedSig;

    const doctorForShell = context.doctor
        ? {
              displayName: context.doctor.displayName,
              specialtyLine: context.doctor.specialtyLine,
              crmLine: context.doctor.crmLine,
          }
        : null;

    return (
        <MedicalDocumentPrintShell
            doctor={doctorForShell}
            clinic={context.clinic}
            documentTitle={context.document.title}
            renderedContentHtml={context.document.renderedContent}
            hideDocumentTitle={context.template?.hideTitleWhenPrinted ?? false}
            issuedAtLine={context.issuedAtLine}
            signatureImageUrl={signatureImageUrl}
        />
    );
}
