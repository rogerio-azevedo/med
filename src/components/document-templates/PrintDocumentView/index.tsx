"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintDocumentViewProps {
  document: {
    id: string;
    title: string;
    renderedContent: string;
    generatedAt: Date | string;
  };
  template?: {
    hideTitleWhenPrinted: boolean;
  };
  clinic: {
    name: string;
    logoUrl?: string | null;
    address?: string | null;
  };
  doctor?: {
    name: string;
    crm?: string | null;
    crmState?: string | null;
  } | null;
}

export function PrintDocumentView({ document, template, clinic, doctor }: PrintDocumentViewProps) {
  // Automatically trigger print when loaded
  useEffect(() => {
    // A small timeout to ensure styles are applied
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white min-h-screen text-black print:bg-transparent p-8 md:p-12 max-w-[21cm] mx-auto font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-6 mb-8">
        <div>
          {clinic.logoUrl ? (
            <img src={clinic.logoUrl} alt={clinic.name} className="h-16 object-contain" />
          ) : (
            <h1 className="text-2xl font-bold">{clinic.name}</h1>
          )}
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Emitido em: {format(new Date(document.generatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          <p className="text-xs mt-1">Ref: {document.id.split('-')[0]}</p>
        </div>
      </header>

      {/* Body */}
      <main className="mb-24 min-h-[500px]">
        {(!template || !template.hideTitleWhenPrinted) && (
          <h2 className="text-2xl font-bold text-center mb-10 uppercase tracking-wider">
            {document.title}
          </h2>
        )}
        
        <div 
          className="whitespace-pre-wrap leading-relaxed text-[15px]"
          dangerouslySetInnerHTML={{ __html: document.renderedContent.replace(/\n/g, '<br/>') }} 
        />
      </main>

      {/* Footer / Signature */}
      <footer className="mt-20 pt-8 border-t flex flex-col items-center justify-center">
        <div className="w-64 border-b border-black mb-2"></div>
        <p className="font-bold text-lg">{doctor?.name || "Assinatura do Profissional"}</p>
        {doctor?.crm && (
          <p className="text-sm text-gray-600">
            CRM: {doctor.crm} {doctor.crmState ? `- ${doctor.crmState}` : ""}
          </p>
        )}
        {clinic.address && (
          <p className="text-xs text-gray-400 mt-6 text-center max-w-md">
            {clinic.address}
          </p>
        )}
      </footer>

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          @page { margin: 2cm; }
        }
      `}} />
    </div>
  );
}
