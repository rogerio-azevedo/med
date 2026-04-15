"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PatientContextPanel } from "../PatientContextPanel";
import { ConsultationTimeline } from "../ConsultationTimeline";
import { ConsultationForm, type ConsultationFormSubmitData } from "../ConsultationForm";
import {
    startConsultationAction,
    saveSoapAction,
    saveVitalSignsAction,
    finishConsultationAction,
    claimConsultationAction,
} from "@/app/actions/consultations";
import { toast } from "sonner";
import { ConsultationDetailSheet, type ConsultationDetailData } from "../ConsultationDetailSheet";
import type { ServiceTypeWorkflow } from "@/lib/service-type-workflows";
import { FileUploadModal } from "../FileUploadModal";
import { MedicalRecordsTimelineToolbar } from "../MedicalRecordsTimelineToolbar";
import { useHeaderStore } from "@/store/header";
import type { MedicalRecordsFileTimelineEntry } from "@/db/queries/medical-records-timeline";

interface MedicalRecordsClientProps {
    clinicId: string;
    patient: { id: string; name: string };
    consultations: ConsultationTimelineItem[];
    fileTimeline: MedicalRecordsFileTimelineEntry[];
    latestVitals?: Record<string, string | number | null>;
    serviceTypes: { id: string; name: string; workflow: "consultation" | "generic" | "exam_review" | "procedure"; slug?: string | null }[];
    healthInsurances: { id: string; name: string }[];
    isDoctor?: boolean;
    /** Attach/remove files on the chart (doctor or clinic admin). */
    canManagePatientFiles?: boolean;
    currentDoctorId?: string;
    /** Opens the encounter created from check-in (queue) directly. */
    queuedConsultation?: QueuedConsultationPayload | null;
}

export type QueuedConsultationPayload = {
    id: string;
    status: string;
    serviceTypeId: string | null;
    healthInsuranceId: string | null;
    serviceType: { name: string | null; workflow: string | null } | null;
};

type ConsultationTimelineItem = {
    id: string;
    startTime: string | Date;
    doctorName?: string | null;
    diagnosis?: string | null;
    cidCode?: string | null;
    serviceTypeName?: string | null;
    status?: string | null;
};

function detailToFormInitial(c: ConsultationDetailData) {
    const v0 = c.vitalSigns?.[0];
    const wfRaw = c.serviceType?.workflow ?? "consultation";
    const serviceTypeWorkflow: ServiceTypeWorkflow =
        wfRaw === "generic" || wfRaw === "exam_review" || wfRaw === "procedure" || wfRaw === "consultation"
            ? wfRaw
            : "consultation";

    return {
        id: c.id,
        soap: {
            subjective: c.soap?.subjective ?? "",
            objective: c.soap?.objective ?? "",
            assessment: c.soap?.assessment ?? "",
            plan: c.soap?.plan ?? "",
            diagnosisCidId: null as string | null,
            diagnosisCode: c.soap?.diagnosisCid?.code ?? "",
            diagnosisDescription: c.soap?.diagnosisCid?.description ?? "",
            diagnosisFreeText: c.soap?.diagnosisFreeText ?? "",
            diagnosisCid: c.soap?.diagnosisCid,
        },
        vitals: {
            weight: v0?.weight ?? "",
            height: v0 && "height" in v0 ? String((v0 as { height?: string }).height ?? "") : "",
            bloodPressure: v0?.bloodPressure ?? "",
            heartRate: v0?.heartRate != null ? String(v0.heartRate) : "",
            temperature: v0?.temperature ?? "",
        },
        serviceTypeId: c.serviceTypeId,
        serviceTypeName: c.serviceType?.name,
        serviceTypeWorkflow,
        healthInsuranceId: c.healthInsuranceId,
    };
}

export function MedicalRecordsClient({
    clinicId,
    patient,
    consultations,
    fileTimeline,
    latestVitals,
    serviceTypes,
    healthInsurances,
    isDoctor,
    canManagePatientFiles = false,
    currentDoctorId,
    queuedConsultation = null,
}: MedicalRecordsClientProps) {
    const router = useRouter();
    const setHeader = useHeaderStore((s) => s.setHeader);
    const setToolbar = useHeaderStore((s) => s.setToolbar);
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    const [uploadOpen, setUploadOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formSessionKey, setFormSessionKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
    const [editingConsultation, setEditingConsultation] = useState<ConsultationDetailData | null>(null);

    const refreshAll = () => router.refresh();

    const handleStartConsultation = useCallback(() => {
        setEditingConsultation(null);
        setFormSessionKey((value) => value + 1);
        setIsFormOpen(true);
    }, []);

    useEffect(() => {
        const name = typeof patient?.name === "string" && patient.name.trim() ? patient.name.trim() : "Paciente";
        setHeader(name, "Prontuário");
        return () => clearHeader();
    }, [patient?.name, setHeader, clearHeader]);

    useEffect(() => {
        setToolbar(
            <MedicalRecordsTimelineToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onNewConsultation={handleStartConsultation}
                isDoctor={isDoctor}
            />
        );
        return () => setToolbar(null);
    }, [searchTerm, isDoctor, handleStartConsultation, setToolbar]);

    useEffect(() => {
        if (!queuedConsultation?.id || !isDoctor) return;

        let cancelled = false;

        (async () => {
            const claim = await claimConsultationAction(queuedConsultation.id, patient.id);
            if (cancelled) return;

            if (!claim.success) {
                toast.error(typeof claim.error === "string" ? claim.error : "Não foi possível assumir o atendimento.");
                router.replace(`/medical-records/${patient.id}`, { scroll: false });
                return;
            }

            const wfRaw = queuedConsultation.serviceType?.workflow ?? "consultation";
            const workflow =
                wfRaw === "generic" || wfRaw === "exam_review" || wfRaw === "procedure" || wfRaw === "consultation"
                    ? wfRaw
                    : "consultation";

            setEditingConsultation({
                id: queuedConsultation.id,
                doctorId: null,
                status: "in_progress",
                startTime: new Date(),
                soap: null,
                vitalSigns: [],
                serviceTypeId: queuedConsultation.serviceTypeId,
                serviceType: {
                    name: queuedConsultation.serviceType?.name ?? null,
                    workflow,
                },
                healthInsuranceId: queuedConsultation.healthInsuranceId,
            });
            setFormSessionKey((value) => value + 1);
            setIsFormOpen(true);
            router.replace(`/medical-records/${patient.id}`, { scroll: false });
        })();

        return () => {
            cancelled = true;
        };
    }, [queuedConsultation?.id, isDoctor, patient.id, router]);

    const patientForContext = useMemo(
        () => ({
            ...patient,
            lastConsultationDate: consultations[0]?.startTime ?? null,
        }),
        [patient, consultations]
    );

    const filteredConsultations = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return consultations;
        return consultations.filter((c) => {
            const doctor = String(c.doctorName ?? "").toLowerCase();
            const diagnosis = String(c.diagnosis ?? "").toLowerCase();
            const typeLabel = String(c.serviceTypeName ?? "").toLowerCase();
            const dateStr = format(new Date(c.startTime), "dd MMM yyyy", { locale: ptBR }).toLowerCase();
            const cid = String(c.cidCode ?? "").toLowerCase();
            return (
                doctor.includes(q) ||
                diagnosis.includes(q) ||
                typeLabel.includes(q) ||
                dateStr.includes(q) ||
                cid.includes(q)
            );
        });
    }, [consultations, searchTerm]);

    const handleEditConsultation = (consultation: ConsultationDetailData) => {
        setEditingConsultation(consultation);
        setFormSessionKey((value) => value + 1);
        setIsFormOpen(true);
    };

    const isEditing = !!editingConsultation;

    const handleSubmitConsultation = async (data: ConsultationFormSubmitData) => {
        try {
            let consultationId = data.consultationId ?? editingConsultation?.id ?? null;

            if (!consultationId) {
                const startResult = await startConsultationAction({
                    patientId: data.patientId,
                    serviceTypeId: data.serviceTypeId,
                    healthInsuranceId: data.healthInsuranceId,
                });

                if (!startResult.success) {
                    toast.error(`Erro ao iniciar consulta: ${startResult.error || "Dados não retornados"}`);
                    return;
                }

                const created = "data" in startResult ? startResult.data : undefined;
                if (!created?.id) {
                    toast.error("Erro ao iniciar consulta: dados não retornados");
                    return;
                }

                consultationId = created.id;
            }

            const soapResult = await saveSoapAction(consultationId!, data.patientId, {
                ...data.soap,
                diagnosisCidId: data.soap.diagnosisCidId,
                diagnosisFreeText: data.soap.diagnosisFreeText,
            });

            if (!soapResult.success) {
                toast.error(`Erro ao salvar prontuário: ${soapResult.error}`);
                return;
            }

            const hasAnyVital = Object.values(data.vitals ?? {}).some(
                (value) => String(value ?? "").trim() !== ""
            );
            if (hasAnyVital) {
                const vitalsResult = await saveVitalSignsAction(consultationId!, data.patientId, data.vitals);

                if (!vitalsResult.success) {
                    toast.error(`Prontuário salvo, mas houve erro ao salvar sinais vitais: ${vitalsResult.error}`);
                    return;
                }
            }

            const finishResult = await finishConsultationAction(consultationId!, data.patientId);
            if (!finishResult.success) {
                toast.warning(
                    `Prontuário salvo, mas o status não foi atualizado para finalizado: ${finishResult.error || "erro desconhecido"}`
                );
            } else {
                toast.success(isEditing ? "Prontuário atualizado com sucesso!" : "Prontuário salvo com sucesso!");
            }

            setIsFormOpen(false);
            setEditingConsultation(null);
            refreshAll();
        } catch (error: unknown) {
            toast.error("Ocorreu um erro inesperado.");
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-screen w-full min-w-0 flex-col bg-background lg:flex-row">
            <aside className="flex min-h-[min(50vh,28rem)] w-full shrink-0 flex-col border-b border-border bg-background lg:h-screen lg:min-h-0 lg:w-[40%] lg:min-w-[20rem] lg:max-w-[44%] lg:border-b-0 lg:border-r">
                <PatientContextPanel
                    patient={patientForContext}
                    latestVitals={latestVitals}
                    alerts={[]}
                    fileTimeline={fileTimeline}
                    canManagePatientFiles={canManagePatientFiles}
                    onAttachFile={canManagePatientFiles ? () => setUploadOpen(true) : undefined}
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
                key={formSessionKey}
                clinicId={clinicId}
                patient={patient}
                serviceTypes={serviceTypes}
                healthInsurances={healthInsurances}
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingConsultation(null);
                }}
                onSubmit={handleSubmitConsultation}
                initialData={editingConsultation ? detailToFormInitial(editingConsultation) : null}
            />
        </div>
    );
}
