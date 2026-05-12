import type { MedicalDocumentPrintClinic } from "@/lib/medical-document/print-layout-types";

function displaySiteLabel(url: string): string {
    const t = url.trim();
    try {
        const u = new URL(t.startsWith("http") ? t : `https://${t}`);
        return u.hostname + (u.pathname && u.pathname !== "/" ? u.pathname : "");
    } catch {
        return t.replace(/^https?:\/\//i, "");
    }
}

type MedicalDocumentFooterProps = {
    clinic: MedicalDocumentPrintClinic;
};

export function MedicalDocumentFooter({ clinic }: MedicalDocumentFooterProps) {
    const hasContacts = Boolean(clinic.phone?.trim()) || Boolean(clinic.websiteUrl?.trim());

    return (
        <footer className="mt-10 border-t border-slate-300 pt-5 text-xs text-black print:mt-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                <div className="space-y-0.5 leading-relaxed">
                    <p className="font-bold">{clinic.name}</p>
                    {clinic.footerAddressLines.length === 0 ? (
                        <p className="text-slate-600">Endereço não cadastrado.</p>
                    ) : (
                        clinic.footerAddressLines.map((line, i) => (
                            <p key={`${i}-${line}`}>{line}</p>
                        ))
                    )}
                </div>
            </div>
        </footer>
    );
}
