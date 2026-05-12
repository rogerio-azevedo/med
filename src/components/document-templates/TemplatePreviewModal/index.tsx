"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseTemplate } from "@/utils/parse-template";
import { useMemo } from "react";
import { MedicalDocumentPrintShell } from "@/components/document-templates/MedicalDocumentPrintShell";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { DOCUMENT_DEFAULT_ISSUE_CITY, DOCUMENT_ISSUED_TIMEZONE } from "@/lib/constants/document-print";

interface TemplatePreviewModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    content: string;
    title: string;
    hideTitleWhenPrinted: boolean;
}

function capitalizeMonthInPortugueseDate(formatted: string): string {
    return formatted.replace(
        /(\d{2}\s+de\s+)([a-záàâãéêíóôõúç]+)(\s+de\s+)/i,
        (_, prefix: string, month: string, suffix: string) =>
            `${prefix}${month.charAt(0).toUpperCase()}${month.slice(1).toLowerCase()}${suffix}`
    );
}

export function TemplatePreviewModal({
    isOpen,
    setIsOpen,
    content,
    title,
    hideTitleWhenPrinted,
}: TemplatePreviewModalProps) {
    const renderedContent = useMemo(() => {
        const fakeData = {
            patient: {
                name: "João da Silva Sauro",
                cpf: "123.456.789-00",
                sex: "Masculino",
                birthDate: "1980-05-15",
                phone: "(11) 98765-4321",
                email: "joao@email.com",
                id: "12345678-abcd-abcd",
                observations: "Paciente alérgico a dipirona.",
                addresses: [
                    {
                        isPrimary: true,
                        street: "Rua das Flores",
                        number: "123",
                        neighborhood: "Centro",
                        city: "São Paulo",
                        state: "SP",
                    },
                ],
                healthInsurances: [
                    {
                        cardNumber: "999888777",
                        healthInsurance: { name: "Unimed" },
                    },
                ],
            },
            consultation: {
                startTime: new Date().toISOString(),
                doctor: { user: { name: "Dr. Carlos Médico" } },
                surgeryProcedures: [{ name: "Consulta de Rotina" }, { name: "Eletrocardiograma" }],
            },
        };

        return parseTemplate(content || "", fakeData);
    }, [content]);

    const sampleIssuedAtLine = useMemo(() => {
        const zoned = formatInTimeZone(
            new Date(),
            DOCUMENT_ISSUED_TIMEZONE,
            "dd 'de' MMMM 'de' yyyy HH:mm",
            { locale: ptBR }
        );
        return `${DOCUMENT_DEFAULT_ISSUE_CITY}, ${capitalizeMonthInPortugueseDate(zoned)}`;
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Visualização do Documento</DialogTitle>
                    <DialogDescription>
                        Prévia com dados de exemplo e layout de impressão (cabeçalho, rodapé e assinatura
                        ilustrativos).
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto rounded-md border bg-muted/20 p-4">
                    <div className="mx-auto border bg-white shadow-sm">
                        <MedicalDocumentPrintShell
                            doctor={{
                                displayName: "Dr. Carlos Médico",
                                specialtyLine: "Clínica Médica/Orientação",
                                crmLine: "CRM 0000/SP",
                            }}
                            clinic={{
                                name: "Instituto da Tireoide",
                                logoUrl: null,
                                phone: "(65) 99615-7171",
                                websiteUrl: "https://www.exemplo.com.br",
                                footerAddressLines: [
                                    "Rua Exemplo, 100",
                                    "Bairro Modelo",
                                    "Cuiabá-MT CEP: 78050-080",
                                ],
                            }}
                            documentTitle={title || "Sem Título"}
                            renderedContentHtml={renderedContent}
                            hideDocumentTitle={hideTitleWhenPrinted}
                            issuedAtLine={sampleIssuedAtLine}
                            signatureImageUrl={null}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
