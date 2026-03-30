"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PatientContextPanel } from "../PatientContextPanel";
import { ConsultationTimeline } from "../ConsultationTimeline";
import { ConsultationForm } from "../ConsultationForm";
import { startConsultationAction, saveSoapAction, saveVitalSignsAction } from "@/app/actions/consultations";
import { toast } from "sonner";
import { ConsultationDetailSheet } from "../ConsultationDetailSheet";
import { FileUploadModal } from "../FileUploadModal";
import { ProntuarioTimelineToolbar } from "../ProntuarioTimelineToolbar";
import { useHeaderStore } from "@/store/header";
import type { ProntuarioFileTimelineEntry } from "@/db/queries/prontuario-timeline";

interface ProntuarioClientProps {
    patient: any;
    consultations: any[];
    fileTimeline: ProntuarioFileTimelineEntry[];
    latestVitals?: any;
    isDoctor?: boolean;
    currentDoctorId?: string;
}

export function ProntuarioClient({
    patient,
    consultations,
    fileTimeline,
    latestVitals,
    isDoctor,
    currentDoctorId,
}: ProntuarioClientProps) {
    const router = useRouter();
    const setHeader = useHeaderStore((s) => s.setHeader);
    const setToolbar = useHeaderStore((s) => s.setToolbar);
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    const [uploadOpen, setUploadOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
    const [editingConsultation, setEditingConsultation] = useState<any>(null);

    const refreshAll = () => router.refresh();

    const handleStartConsultation = useCallback(() => {
        setEditingConsultation(null);
        setIsFormOpen(true);
    }, []);

    useEffect(() => {
        const name = typeof patient?.name === "string" && patient.name.trim() ? patient.name.trim() : "Paciente";
        setHeader(name, "Prontuário");
        return () => clearHeader();
    }, [patient?.name, setHeader, clearHeader]);

    useEffect(() => {
        setToolbar(
            <ProntuarioTimelineToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onNewConsultation={handleStartConsultation}
                isDoctor={isDoctor}
            />
        );
        return () => setToolbar(null);
    }, [searchTerm, isDoctor, handleStartConsultation, setToolbar]);

    const filteredConsultations = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return consultations;
        return consultations.filter((c) => {
            const doctor = String(c.doctorName ?? "").toLowerCase();
            const diagnosis = String(c.diagnosis ?? "").toLowerCase();
            const type = String(c.type ?? "").toLowerCase();
            const dateStr = format(new Date(c.startTime), "dd MMM yyyy", { locale: ptBR }).toLowerCase();
            const cid = String(c.cidCode ?? "").toLowerCase();
            return (
                doctor.includes(q) ||
                diagnosis.includes(q) ||
                type.includes(q) ||
                dateStr.includes(q) ||
                cid.includes(q)
            );
        });
    }, [consultations, searchTerm]);

    const handleEditConsultation = (consultation: any) => {
        setEditingConsultation(consultation);
        setIsFormOpen(true);
    };

    const handleSubmitConsultation = async (data: any) => {
        try {
            let consultationId = editingConsultation?.id;

            if (!isEditing) {
                const startResult = await startConsultationAction({
                    patientId: patient.id,
                    type: "consultation",
                });

                if (!startResult.success || !startResult.data) {
                    toast.error("Erro ao iniciar consulta: " + (startResult.error || "Dados não retornados"));
                    return;
                }

                consultationId = startResult.data.id;
            }

            const soapResult = await saveSoapAction(consultationId, patient.id, {
                ...data.soap,
                diagnosisCidId: data.soap.diagnosisCidId,
                diagnosisFreeText: data.soap.diagnosisFreeText,
            });

            if (!soapResult.success) {
                toast.error("Erro ao salvar prontuário: " + soapResult.error);
                return;
            }

            const hasAnyVital = Object.values(data.vitals ?? {}).some(
                (value) => String(value ?? "").trim() !== ""
            );
            if (hasAnyVital) {
                const vitalsResult = await saveVitalSignsAction(consultationId, patient.id, data.vitals);

                if (!vitalsResult.success) {
                    toast.error("Prontuário salvo, mas houve erro ao salvar sinais vitais: " + vitalsResult.error);
                    return;
                }
            }

            toast.success(isEditing ? "Prontuário atualizado com sucesso!" : "Prontuário salvo com sucesso!");
            setIsFormOpen(false);
            setEditingConsultation(null);
            refreshAll();
        } catch (error: any) {
            toast.error("Ocorreu um erro inesperado.");
            console.error(error);
        }
    };

    const isEditing = !!editingConsultation;

    return (
        <div className="flex min-h-screen w-full min-w-0 flex-col bg-background lg:flex-row">
            <aside className="flex min-h-[min(50vh,28rem)] w-full shrink-0 flex-col border-b border-border bg-background lg:h-screen lg:min-h-0 lg:w-[40%] lg:min-w-[20rem] lg:max-w-[44%] lg:border-b-0 lg:border-r">
                <PatientContextPanel
                    patient={patient}
                    latestVitals={latestVitals}
                    alerts={[]}
                    fileTimeline={fileTimeline}
                    isDoctor={isDoctor}
                    onAnexarArquivo={isDoctor ? () => setUploadOpen(true) : undefined}
                    onFilesChanged={refreshAll}
                />
            </aside>

            <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/10">
                <div className="border-b bg-muted/30 px-5 py-3 md:px-8">
                    <p className="text-center text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground/80">Atendimentos</span> em ordem cronológica
                        (mais recente no topo).{" "}
                        <span className="font-medium text-foreground/80">Arquivos e exames</span> ficam na coluna à
                        esquerda, na própria linha do tempo de documentos.
                    </p>
                </div>

                <div className="w-full flex-1 overflow-y-auto p-5 md:p-8">
                    <ConsultationTimeline consultations={filteredConsultations} onSelect={setSelectedConsultationId} />
                </div>

                <FileUploadModal
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    patientId={patient.id}
                    onSuccess={refreshAll}
                />
            </main>

            <ConsultationDetailSheet
                consultationId={selectedConsultationId}
                onClose={() => setSelectedConsultationId(null)}
                onEdit={handleEditConsultation}
                patientId={patient.id}
                currentDoctorId={currentDoctorId}
                onTimelineRefresh={refreshAll}
            />

            <ConsultationForm
                patient={patient}
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingConsultation(null);
                }}
                onSubmit={handleSubmitConsultation}
                initialData={
                    editingConsultation
                        ? {
                              id: editingConsultation.id,
                              soap: editingConsultation.soap,
                              vitals: editingConsultation.vitalSigns?.[0] || {},
                          }
                        : null
                }
            />
        </div>
    );
}
