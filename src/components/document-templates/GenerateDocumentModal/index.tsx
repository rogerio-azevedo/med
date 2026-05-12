"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useTransition, useRef } from "react";
import {
    generateDocumentAction,
    renderDocumentTemplateAction,
    getDocumentTemplateModalPreviewShellAction,
} from "@/app/actions/document-templates";
import { toast } from "sonner";
import { Loader2, Search, FileText, Printer, Download, ArrowLeft, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TEMPLATE_CATEGORY_LABELS } from "@/lib/validations/document-templates";
import { MedicalDocumentPrintShell } from "@/components/document-templates/MedicalDocumentPrintShell";
import { IssueDocumentSignaturePanel } from "@/components/document-templates/IssueDocumentSignaturePanel";
import type { DocumentModalPreviewShell } from "@/db/queries/document-templates/modal-shell-preview";
import { documentTemplates } from "@/db/schema/document-templates";
import { GeneratedDocumentBodyEditor } from "@/components/document-templates/GeneratedDocumentBodyEditor";

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
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [bodyEditSession, setBodyEditSession] = useState(0);
    const [hasConfirmedBodyEdits, setHasConfirmedBodyEdits] = useState(false);
    const lexicalBridgeRef = useRef<{ getHtml: () => string } | null>(null);

    const handleDialogOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSelectedTemplate(null);
            setRenderedData(null);
            setPreviewShell(null);
            setSearchTerm("");
            setIssueSig(null);
            setIsEditingBody(false);
            setHasConfirmedBodyEdits(false);
            setBodyEditSession(0);
        }
    };

    const handleSelectTemplate = (template: DocumentTemplateListItem) => {
        setSelectedTemplate(template);
        setIsEditingBody(false);
        setHasConfirmedBodyEdits(false);
        setBodyEditSession(0);

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
        if (!selectedTemplate || !renderedData) return;
        startTransition(async () => {
            try {
                const doc = await generateDocumentAction(
                    selectedTemplate.id,
                    patientId,
                    consultationId,
                    hasConfirmedBodyEdits ? renderedData.renderedContent : undefined
                );
                setIssueSig({ docId: doc.id, templateId: selectedTemplate.id, printMode });
            } catch {
                toast.error("Erro ao gerar documento.");
            }
        });
    };

    const handleStartBodyEdit = () => {
        setBodyEditSession((n) => n + 1);
        setIsEditingBody(true);
    };

    const handleConfirmBodyEdit = () => {
        const getter = lexicalBridgeRef.current?.getHtml;
        if (!getter) {
            toast.error("Editor ainda não está pronto. Tente novamente.");
            return;
        }
        const html = getter();
        setRenderedData((prev) => (prev ? { ...prev, renderedContent: html } : null));
        setHasConfirmedBodyEdits(true);
        setIsEditingBody(false);
    };

    const handleCancelBodyEdit = () => {
        setIsEditingBody(false);
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

    const isSignatureStep = Boolean(issueSig && renderedData && previewShell);

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="flex h-[85vh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
                {isSignatureStep && issueSig && renderedData && previewShell ? (
                    <>
                        <div className="border-b p-4 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <DialogHeader className="min-w-0 flex-1 space-y-1.5 p-0 text-left">
                                    <DialogTitle>Assinar e abrir</DialogTitle>
                                    <DialogDescription className="text-left">
                                        {issueSig.printMode === "pdf"
                                            ? "O documento já foi gerado. Depois de escolher a assinatura, o PDF abrirá em uma nova aba."
                                            : "O documento já foi gerado. Depois de escolher a assinatura, a impressão abrirá em uma nova aba."}
                                    </DialogDescription>
                                </DialogHeader>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 gap-1.5"
                                    disabled={isPending}
                                    onClick={() => setIssueSig(null)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </Button>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                            <div
                                className="min-h-[36vh] shrink-0 border-b bg-muted/30 lg:min-h-0 lg:w-[52%] lg:border-b-0 lg:border-r"
                                aria-hidden
                                tabIndex={-1}
                            >
                                <div className="h-full max-h-[42vh] overflow-y-auto p-4 sm:p-6 lg:max-h-full">
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
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                                <IssueDocumentSignaturePanel
                                    key={issueSig.docId}
                                    docId={issueSig.docId}
                                    templateId={issueSig.templateId}
                                    printMode={issueSig.printMode}
                                    disabled={isPending}
                                    onComplete={() => {
                                        toast.success("Documento gerado com sucesso!");
                                        setIssueSig(null);
                                        setIsOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
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
                                                        <h4
                                                            className="truncate text-sm font-medium"
                                                            title={template.title}
                                                        >
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
                                                {!isEditingBody ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isPending}
                                                        onClick={handleStartBodyEdit}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar documento
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="default"
                                                            size="sm"
                                                            disabled={isPending}
                                                            onClick={handleConfirmBodyEdit}
                                                        >
                                                            Confirmar edição
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isPending}
                                                            onClick={handleCancelBodyEdit}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isPending || isEditingBody}
                                                    onClick={() => runGenerate("print")}
                                                >
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    Gerar e imprimir
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isPending || isEditingBody}
                                                    onClick={() => runGenerate("pdf")}
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Gerar PDF
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                                            {isEditingBody ? (
                                                <GeneratedDocumentBodyEditor
                                                    key={bodyEditSession}
                                                    html={renderedData.renderedContent}
                                                    bridgeRef={lexicalBridgeRef}
                                                    className="mx-auto max-w-[21cm] shadow-sm"
                                                />
                                            ) : (
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
                                            )}
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
