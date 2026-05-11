"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseTemplate } from "@/utils/parse-template";
import { Printer } from "lucide-react";
import { useMemo } from "react";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  content: string;
  title: string;
  hideTitleWhenPrinted: boolean;
}

export function TemplatePreviewModal({ isOpen, setIsOpen, content, title, hideTitleWhenPrinted }: TemplatePreviewModalProps) {
  
  const renderedContent = useMemo(() => {
    // Fake data for preview
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
        addresses: [{
          isPrimary: true,
          street: "Rua das Flores",
          number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
        }],
        healthInsurances: [{
          cardNumber: "999888777",
          healthInsurance: { name: "Unimed" }
        }]
      },
      consultation: {
        startTime: new Date().toISOString(),
        doctor: { user: { name: "Dr. Carlos Médico" } },
        surgeryProcedures: [{ name: "Consulta de Rotina" }, { name: "Eletrocardiograma" }]
      }
    };

    return parseTemplate(content || "", fakeData);
  }, [content]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Visualização do Documento</DialogTitle>
          <DialogDescription>
            Assim é como o documento ficará (com dados de exemplo).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/20 p-8 border rounded-md min-h-[400px]">
          <div className="bg-white text-black p-10 min-h-full shadow-sm max-w-[21cm] mx-auto whitespace-pre-wrap font-sans">
            {!hideTitleWhenPrinted && (
              <h1 className="text-xl font-bold text-center mb-8 uppercase">
                {title || "Sem Título"}
              </h1>
            )}
            <div dangerouslySetInnerHTML={{ __html: renderedContent.replace(/\n/g, '<br/>') }} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
