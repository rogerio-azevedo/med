"use client";

import { useState } from "react";
import { PatientContextPanel } from "../PatientContextPanel";
import { ConsultationTimeline } from "../ConsultationTimeline";
import { TimelineFilters } from "../TimelineFilters";
import { ConsultationForm } from "../ConsultationForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { startConsultationAction, saveSoapAction } from "@/app/actions/consultations";
import { toast } from "sonner";
import { ConsultationDetailSheet } from "../ConsultationDetailSheet";

interface ProntuarioClientProps {
    patient: any;
    consultations: any[];
    isDoctor?: boolean;
}

export function ProntuarioClient({ patient, consultations, isDoctor }: ProntuarioClientProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

    const handleStartConsultation = () => {
        setIsFormOpen(true);
    };

    const handleSubmitConsultation = async (data: any) => {
        try {
            // 1. Iniciar a consulta
            const startResult = await startConsultationAction({
                patientId: patient.id,
                type: "consultation",
            });

            if (!startResult.success || !startResult.data) {
                toast.error("Erro ao iniciar consulta: " + (startResult.error || "Dados não retornados"));
                return;
            }

            const consultationId = startResult.data.id;

            // 2. Salvar o SOAP e diagnóstico
            const soapResult = await saveSoapAction(consultationId, patient.id, {
                ...data.soap,
                diagnosisCidId: data.soap.diagnosisCidId,
                diagnosisFreeText: data.soap.diagnosisFreeText,
            });

            if (!soapResult.success) {
                toast.error("Erro ao salvar prontuário: " + soapResult.error);
                return;
            }

            toast.success("Prontuário salvo com sucesso!");
            setIsFormOpen(false);
        } catch (error: any) {
            toast.error("Ocorreu um erro inesperado.");
            console.error(error);
        }
    };

    return (
        <div className="flex bg-background min-h-screen">
            {/* Painel Lateral de Contexto do Paciente */}
            <aside className="w-80 flex-shrink-0 border-r bg-background">
                <PatientContextPanel 
                    patient={patient} 
                    alerts={[]} 
                />
            </aside>

            {/* Conteúdo Principal - Timeline */}
            <main className="flex-1 flex flex-col bg-muted/10">
                {/* Header de Filtros e Procura */}
                <div className="p-6 bg-background border-b shadow-sm flex items-center justify-between gap-4">
                    <div className="flex-1 flex items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar no histórico..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <TimelineFilters onFilterChange={() => {}} />
                    </div>
                    <Button 
                        onClick={handleStartConsultation} 
                        className="gap-2"
                        disabled={!isDoctor}
                        title={!isDoctor ? "Apenas médicos podem iniciar atendimentos" : ""}
                    >
                        <Plus className="h-4 w-4" />
                        Novo Atendimento
                    </Button>
                </div>

                {/* Lista da Timeline */}
                <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                    <ConsultationTimeline 
                        consultations={consultations} 
                        onSelect={setSelectedConsultationId}
                    />
                </div>
            </main>

            <ConsultationDetailSheet 
                consultationId={selectedConsultationId}
                onClose={() => setSelectedConsultationId(null)}
            />

            <ConsultationForm 
                patient={patient}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSubmitConsultation}
            />
        </div>
    );
}
