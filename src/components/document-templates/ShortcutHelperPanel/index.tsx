"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const shortcutGroups = [
  {
    label: "Paciente",
    shortcuts: [
      { code: "@@nome", desc: "Nome completo do paciente" },
      { code: "@@cpf", desc: "CPF do paciente" },
      { code: "@@sexo", desc: "Sexo" },
      { code: "@@dtnasc", desc: "Data de nascimento" },
      { code: "@@idade", desc: "Idade atual" },
      { code: "@@telefone", desc: "Telefone/Celular" },
      { code: "@@email", desc: "E-mail do paciente" },
      { code: "@@idpaciente", desc: "ID curto do paciente" },
      { code: "@@endereco", desc: "Endereço principal completo" },
      { code: "@@convenio", desc: "Nome do convênio/plano" },
      { code: "@@numerodamatricula", desc: "Número da carteirinha" },
      { code: "@@observacoes", desc: "Observações do cadastro" },
    ],
  },
  {
    label: "Atendimento",
    shortcuts: [
      { code: "@@data", desc: "Data da consulta (ex: 15/04/2024)" },
      { code: "@@horario", desc: "Horário da consulta (ex: 14:30)" },
      { code: "@@dataextenso", desc: "Data por extenso" },
      { code: "@@proced", desc: "Procedimentos do atendimento" },
    ],
  },
  {
    label: "Profissional",
    shortcuts: [
      { code: "@@profissional", desc: "Nome do profissional do atendimento" },
      { code: "@@medsol", desc: "Médico solicitante (mesmo que profissional)" },
    ],
  },
  {
    label: "Datas Relativas",
    shortcuts: [
      { code: "@@hoje", desc: "Data atual" },
      { code: "@@hoje+7", desc: "Data atual + 7 dias" },
      { code: "@@hoje+15", desc: "Data atual + 15 dias" },
      { code: "@@hoje+30", desc: "Data atual + 30 dias" },
      { code: "@@hoje-7", desc: "Data atual - 7 dias" },
    ],
  },
];

export function ShortcutHelperPanel() {
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedShortcut(code);
    setTimeout(() => setCopiedShortcut(null), 2000);
  };

  return (
    <div className="w-full flex flex-col h-full bg-muted/30 border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Atalhos Disponíveis</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Clique no ícone para copiar e cole no corpo do documento.
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion type="single" collapsible defaultValue="item-0">
            {shortcutGroups.map((group, groupIdx) => (
              <AccordionItem key={groupIdx} value={`item-${groupIdx}`}>
                <AccordionTrigger className="py-2 text-sm font-medium">
                  {group.label}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 mt-2">
                    {group.shortcuts.map((shortcut) => (
                      <li key={shortcut.code} className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col">
                          <code className="text-xs font-mono font-semibold text-primary">{shortcut.code}</code>
                          <span className="text-[10px] text-muted-foreground">{shortcut.desc}</span>
                        </div>
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => handleCopy(shortcut.code)}
                              >
                                {copiedShortcut === shortcut.code ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copiar atalho</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}
