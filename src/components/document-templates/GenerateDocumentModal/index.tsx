"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import {
    generateDocumentAction,
    renderDocumentTemplateAction,
    getDocumentTemplateModalPreviewShellAction,
} from "@/app/actions/document-templates";
import { toast } from "sonner";
import { Loader2, Search, FileText, Printer, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TEMPLATE_CATEGORY_LABELS } from "@/lib/validations/document-templates";
import { MedicalDocumentPrintShell } from "@/components/document-templates/MedicalDocumentPrintShell";
import { IssueDocumentSignatureDialog } from "@/components/document-templates/IssueDocumentSignatureDialog";
import type { DocumentModalPreviewShell } from "@/db/queries/document-templates/modal-shell-preview";
import { documentTemplates } from "@/db/schema/document-templates";

export type DocumentTemplateListItem = Pick<
    typeof documentTemplates.$inferSelect,
    "id" | "title" | "category"
>;

interface GenerateDocumentModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    patientId: string;
    consultationId?: string;
    templates: DocumentTemplateListItem[];
}

export function GenerateDocumentModal({
    isOpen,
    setIsOpen,
    patientId,
    consultationId,
    templates,
}: GenerateDocumentModalProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateListItem | null>(null);
    const [renderedData, setRenderedData] = useState<{
        renderedContent: string;
        title: string;
        hideTitleWhenPrinted: boolean;
    } | null>(null);
    const [previewShell, setPreviewShell] = useState<DocumentModalPreviewShell | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [issueSig, setIssueSig] = useState<{
        docId: string;
        templateId: string;
        printMode: "print" | "pdf";
    } | null>(null);

    const handleDialogOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSelectedTemplate(null);
            setRenderedData(null);
            setPreviewShell(null);
            setSearchTerm("");
            setIssueSig(null);
        }
    };

    const handleSelectTemplate = (template: DocumentTemplateListItem) => {
        setSelectedTemplate(template);

        startTransition(async () => {
            try {
                const [data, shell] = await Promise.all([
                    renderDocumentTemplateAction(template.id, patientId, consultationId),
                    getDocumentTemplateModalPreviewShellAction(),
                ]);
                setRenderedData(data);
                setPreviewShell(shell);
            } catch {
                toast.error("Erro ao carregar preview do documento");
                setSelectedTemplate(null);
                setRenderedData(null);
                setPreviewShell(null);
            }
        });
    };

    const runGenerate = (printMode: "print" | "pdf") => {
        if (!selectedTemplate) return;
        startTransition(async () => {
            try {
                const doc = await generateDocumentAction(
                    selectedTemplate.id,
                    patientId,
                    consultationId
                );
                setIssueSig({ docId: doc.id, templateId: selectedTemplate.id, printMode });
            } catch {
                toast.error("Erro ao gerar documento.");
            }
        });
    };

    const filteredTemplates = templates.filter(
        (t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            TEMPLATE_CATEGORY_LABELS[
                t.category as keyof typeof TEMPLATE_CATEGORY_LABELS
            ]
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {issueSig ? (
                <IssueDocumentSignatureDialog
                    open
                    onOpenChange={(open) => {
                        if (!open) setIssueSig(null);
                    }}
                    docId={issueSig.docId}
                    templateId={issueSig.templateId}
                    printMode={issueSig.printMode}
                    onComplete={() => {
                        toast.success("Documento gerado com sucesso!");
                        setIssueSig(null);
                        setIsOpen(false);
                    }}
                />
            ) : null}

            <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent className="flex h-[85vh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
                    <div className="border-b p-6 pb-4">
                        <DialogHeader>
                            <DialogTitle>Gerar Documento</DialogTitle>
                            <DialogDescription>
                                Selecione um modelo para preencher com os dados do paciente.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        <div className="flex w-1/3 flex-col border-r bg-muted/10">
                            <div className="border-b p-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar modelo..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="space-y-1 p-2">
                                    {filteredTemplates.length === 0 ? (
                                        <p className="p-4 text-center text-sm text-muted-foreground">
                                            Nenhum modelo encontrado.
                                        </p>
                                    ) : (
                                        filteredTemplates.map((template) => (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => handleSelectTemplate(template)}
                                                className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                                                    selectedTemplate?.id === template.id
                                                        ? "border-primary/20 bg-primary/10"
                                                        : "border-transparent hover:bg-muted"
                                                }`}
                                            >
                                                <div className="mt-0.5 rounded border bg-background p-1.5 shadow-sm">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <h4 className="truncate text-sm font-medium" title={template.title}>
                                                        {template.title}
                                                    </h4>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {
                                                            TEMPLATE_CATEGORY_LABELS[
                                                                template.category as keyof typeof TEMPLATE_CATEGORY_LABELS
                                                            ]
                                                        }
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="relative flex flex-1 flex-col bg-muted/30">
                            {isPending && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}

                            {renderedData && previewShell ? (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background p-4">
                                        <h3 className="flex flex-wrap items-center gap-2 font-medium">
                                            Pré-visualização
                                            {renderedData.hideTitleWhenPrinted && (
                                                <span className="rounded bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                                                    Título oculto na impressão
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => runGenerate("print")}
                                            >
                                                <Printer className="mr-2 h-4 w-4" />
                                                Gerar e imprimir
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => runGenerate("pdf")}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Gerar PDF
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                                        <div className="mx-auto max-w-[21cm] border bg-white shadow-sm">
                                            <MedicalDocumentPrintShell
                                                doctor={previewShell.doctor}
                                                clinic={previewShell.clinic}
                                                documentTitle={renderedData.title}
                                                renderedContentHtml={renderedData.renderedContent}
                                                hideDocumentTitle={renderedData.hideTitleWhenPrinted}
                                                issuedAtLine={previewShell.sampleIssuedAtLine}
                                                signatureImageUrl={previewShell.sampleSignatureImageUrl}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <FileText className="mb-4 h-12 w-12 opacity-20" />
                                    <p>Selecione um modelo na lista para ver a pré-visualização.</p>
                                    <p className="mt-2 text-sm opacity-70">
                                        Os atalhos serão preenchidos automaticamente com os dados do paciente
                                        {consultationId ? " e da consulta" : ""}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
