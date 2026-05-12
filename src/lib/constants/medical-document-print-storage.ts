/** sessionStorage: assinatura temporária antes de abrir a janela de impressão. */
export function medicalDocumentPrintSignatureKey(docId: string): string {
    return `med-doc-print-sig:${docId}`;
}
