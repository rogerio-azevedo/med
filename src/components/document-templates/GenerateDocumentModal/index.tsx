"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useTransition, useEffect } from "react";
import { generateDocumentAction, renderDocumentTemplateAction } from "@/app/actions/document-templates";
import { toast } from "sonner";
import { Loader2, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TEMPLATE_CATEGORY_LABELS } from "@/lib/validations/document-templates";

interface GenerateDocumentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  patientId: string;
  consultationId?: string;
  templates: any[]; // The list of available templates
}

export function GenerateDocumentModal({
  isOpen,
  setIsOpen,
  patientId,
  consultationId,
  templates,
}: GenerateDocumentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [renderedData, setRenderedData] = useState<{ renderedContent: string; title: string, hideTitleWhenPrinted: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Clear state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setRenderedData(null);
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    
    // Fetch rendered preview
    startTransition(async () => {
      try {
        const data = await renderDocumentTemplateAction(template.id, patientId, consultationId);
        setRenderedData(data);
      } catch (error) {
        toast.error("Erro ao carregar preview do documento");
        setSelectedTemplate(null);
      }
    });
  };

  const handleGenerateAndPrint = () => {
    if (!selectedTemplate) return;

    startTransition(async () => {
      try {
        const doc = await generateDocumentAction(selectedTemplate.id, patientId, consultationId);
        
        // Open print window
        window.open(`/document-templates/${selectedTemplate.id}/print?docId=${doc.id}`, "_blank");
        
        toast.success("Documento gerado com sucesso!");
        setIsOpen(false);
      } catch (error) {
        toast.error("Erro ao gerar documento.");
      }
    });
  };

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    TEMPLATE_CATEGORY_LABELS[t.category as keyof typeof TEMPLATE_CATEGORY_LABELS].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-7xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>Gerar Documento</DialogTitle>
            <DialogDescription>
              Selecione um modelo para preencher com os dados do paciente.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar - Templates List */}
          <div className="w-1/3 border-r flex flex-col bg-muted/10">
            <div className="p-4 border-b">
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
              <div className="p-2 space-y-1">
                {filteredTemplates.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Nenhum modelo encontrado.</p>
                ) : (
                  filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`w-full text-left p-3 rounded-md transition-colors flex items-start gap-3 ${
                        selectedTemplate?.id === template.id 
                          ? "bg-primary/10 border-primary/20 border" 
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="mt-0.5 bg-background p-1.5 rounded shadow-sm border">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-medium truncate" title={template.title}>{template.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {TEMPLATE_CATEGORY_LABELS[template.category as keyof typeof TEMPLATE_CATEGORY_LABELS]}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main - Preview Area */}
          <div className="flex-1 flex flex-col bg-muted/30 relative">
            {isPending && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {renderedData ? (
              <>
                <div className="p-4 border-b bg-background flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    Pré-visualização
                    {renderedData.hideTitleWhenPrinted && (
                      <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        Título Oculto
                      </span>
                    )}
                  </h3>
                  <Button onClick={handleGenerateAndPrint} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Gerar e Imprimir
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="bg-white text-black p-10 min-h-full shadow-sm max-w-[21cm] mx-auto whitespace-pre-wrap font-sans border">
                    {!renderedData.hideTitleWhenPrinted && (
                      <h1 className="text-xl font-bold text-center mb-8 uppercase">
                        {renderedData.title}
                      </h1>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: renderedData.renderedContent.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>Selecione um modelo na lista para ver a pré-visualização.</p>
                <p className="text-sm mt-2 opacity-70">
                  Os atalhos serão preenchidos automaticamente com os dados do paciente{consultationId ? " e da consulta" : ""}.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
