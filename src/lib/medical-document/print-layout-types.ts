export type MedicalDocumentPrintDoctor = {
    displayName: string;
    specialtyLine: string | null;
    crmLine: string | null;
};

export type MedicalDocumentPrintClinic = {
    name: string;
    logoUrl: string | null;
    phone: string | null;
    websiteUrl: string | null;
    footerAddressLines: string[];
};

export type MedicalDocumentPrintShellProps = {
    doctor: MedicalDocumentPrintDoctor | null;
    clinic: MedicalDocumentPrintClinic;
    documentTitle: string;
    renderedContentHtml: string;
    hideDocumentTitle: boolean;
    issuedAtLine: string;
    /** URL da imagem de assinatura (servidor ou data URL temporária). */
    signatureImageUrl: string | null;
};
