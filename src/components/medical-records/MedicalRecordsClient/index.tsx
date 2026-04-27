"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PatientContextPanel } from "../PatientContextPanel";
import { ConsultationTimeline, type MedicalTimelineRow } from "../ConsultationTimeline";
import { ConsultationForm, type ConsultationFormSubmitData } from "../ConsultationForm";
import {
    startConsultationAction,
    saveSoapAction,
    saveVitalSignsAction,
    finishConsultationAction,
    claimConsultationAction,
} from "@/app/actions/consultations";
import { claimSurgeryAction } from "@/app/actions/surgeries";
import { toast } from "sonner";
import { ConsultationDetailSheet, type ConsultationDetailData } from "../ConsultationDetailSheet";
import {
    defaultTimelineTypeFilter,
    timelineRowMatchesTypeFilter,
    type TimelineTypeFilter,
} from "../TimelineFilters";
import type { ServiceTypeWorkflow } from "@/lib/service-type-workflows";
import { FileUploadModal } from "../FileUploadModal";
import { MedicalRecordsTimelineToolbar } from "../MedicalRecordsTimelineToolbar";
import { useHeaderStore } from "@/store/header";
import type { MedicalRecordsFileTimelineEntry } from "@/db/queries/medical-records";
import { SurgeryForm } from "@/components/surgeries/SurgeryForm";
import { isSurgeryServiceType } from "@/lib/surgery-service-type";
import { normalizeForSearch } from "@/lib/search-normalize";

interface MedicalRecordsClientProps {
    clinicId: string;
    patient: { id: string; name: string };
    consultations: ConsultationTimelineItem[];
    surgeries: MedicalTimelineRow[];
    fileTimeline: MedicalRecordsFileTimelineEntry[];
    latestVitals?: Record<string, string | number | null>;
    serviceTypes: {
        id: string;
        name: string;
        workflow: "consultation" | "generic" | "exam_review" | "procedure" | "surgery" | "return";
        slug?: string | null;
    }[];
    healthInsurances: { id: string; name: string }[];
    doctors: { id: string; name: string | null }[];
    hospitals: { id: string; name: string }[];
    procedures: { id: string; name: string }[];
    isDoctor?: boolean;
    /** Attach/remove files on the chart (doctor or clinic admin). */
    canManagePatientFiles?: boolean;
    /** Admin da clínica pode excluir consultas/cirurgias */
    canDeleteClinicalRecordsAsAdmin?: boolean;
    currentDoctorId?: string;
    /** Opens the encounter created from check-in (queue) directly. */
    queuedConsultation?: QueuedConsultationPayload | null;
    queuedSurgery?: QueuedConsultationPayload | null;
}

export type QueuedConsultationPayload = {
    id: string;
    status: string;
    serviceTypeId: string | null;
    healthInsuranceId: string | null;
    serviceType: { name: string | null; workflow: string | null; slug?: string | null } | null;
};

type ConsultationTimelineItem = {
    id: string;
    /** Usado no servidor para enriquecer ícone/cor do catálogo */
    serviceTypeId?: string | null;
    startTime: string | Date;
    doctorName?: string | null;
    diagnosis?: string | null;
    cidCode?: string | null;
    serviceTypeName?: string | null;
    serviceTypeWorkflow?: string | null;
    serviceTypeSlug?: string | null;
    serviceTypeTimelineIconKey?: string | null;
    serviceTypeTimelineColorHex?: string | null;
    status?: string | null;
    hasReturn?: boolean;
    parentConsultationId?: string | null;
    healthInsuranceId?: string | null;
};

/** Monta o estado de edição a partir do registro recém-criado em `startConsultation` (retorno). */
function createdReturnToDetailData(
    row: {
        id: string;
        status: string;
        startTime: Date;
        serviceTypeId: string | null;
        healthInsuranceId: string | null;
        parentConsultationId: string | null;
        doctorId: string | null;
    },
    st: { name: string }
): ConsultationDetailData {
    return {
        id: row.id,
        doctorId: row.doctorId,
        status: row.status,
        startTime: row.startTime,
        soap: null,
        vitalSigns: [],
        serviceType: { name: st.name, workflow: "return" },
        serviceTypeId: row.serviceTypeId,
        parentConsultationId: row.parentConsultationId,
        healthInsuranceId: row.healthInsuranceId,
    };
}

function detailToFormInitial(c: ConsultationDetailData) {
    const v0 = c.vitalSigns?.[0];
    const wfRaw = c.serviceType?.workflow ?? "consultation";
    const serviceTypeWorkflow: ServiceTypeWorkflow =
        wfRaw === "generic" ||
        wfRaw === "exam_review" ||
        wfRaw === "procedure" ||
        wfRaw === "consultation" ||
        wfRaw === "return"
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
    surgeries,
    fileTimeline,
    latestVitals,
    serviceTypes,
    healthInsurances,
    doctors,
    hospitals,
    procedures,
    isDoctor,
    canManagePatientFiles = false,
    canDeleteClinicalRecordsAsAdmin = false,
    currentDoctorId,
    queuedConsultation = null,
    queuedSurgery = null,
}: MedicalRecordsClientProps) {
    const router = useRouter();
    const setHeader = useHeaderStore((s) => s.setHeader);
    const setToolbar = useHeaderStore((s) => s.setToolbar);
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    const [uploadOpen, setUploadOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formSessionKey, setFormSessionKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<TimelineTypeFilter>(defaultTimelineTypeFilter);
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
    const [editingConsultation, setEditingConsultation] = useState<ConsultationDetailData | null>(null);
    const [isStartingReturn, setIsStartingReturn] = useState(false);

    const [surgeryFormOpen, setSurgeryFormOpen] = useState(false);
    const [activeSurgeryId, setActiveSurgeryId] = useState<string | null>(null);

    const refreshAll = () => router.refresh();

    const handleStartConsultation = useCallback(() => {
        setEditingConsultation(null);
        setFormSessionKey((value) => value + 1);
        setIsFormOpen(true);
    }, []);

    const openReturnFormForParent = useCallback(
        async (parentConsultationId: string, healthInsuranceId: string | null) => {
            const st = serviceTypes.find((s) => s.workflow === "return");
            if (!st) {
                toast.error(
                    'Cadastre um tipo de atendimento com fluxo "Retorno" (Cadastros → Tipos de atendimento).'
                );
                return;
            }
            setIsStartingReturn(true);
            try {
                const res = await startConsultationAction({
                    patientId: patient.id,
                    serviceTypeId: st.id,
                    healthInsuranceId,
                    parentConsultationId,
                });
                if (!res.success) {
                    toast.error(
                        typeof res.error === "string" ? res.error : "Não foi possível iniciar o retorno."
                    );
                    return;
                }
                const created = "data" in res ? res.data : undefined;
                if (!created?.id) {
                    toast.error("Resposta inválida ao iniciar retorno.");
                    return;
                }
                setEditingConsultation(createdReturnToDetailData(created, { name: st.name }));
                setFormSessionKey((value) => value + 1);
                setIsFormOpen(true);
                setSelectedConsultationId(null);
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Erro inesperado ao iniciar retorno.";
                toast.error(msg);
            } finally {
                setIsStartingReturn(false);
            }
        },
        [serviceTypes, patient.id]
    );

    const handleStartReturn = useCallback(
        (detail: ConsultationDetailData) => {
            void openReturnFormForParent(detail.id, detail.healthInsuranceId ?? null);
        },
        [openReturnFormForParent]
    );

    useEffect(() => {
        setHeader("Prontuário");
        return () => clearHeader();
    }, [setHeader, clearHeader]);

    useEffect(() => {
        setToolbar(
            <MedicalRecordsTimelineToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onNewConsultation={handleStartConsultation}
                isDoctor={isDoctor}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
            />
        );
        return () => setToolbar(null);
    }, [searchTerm, typeFilter, isDoctor, handleStartConsultation, setToolbar]);

    useEffect(() => {
        if (!queuedConsultation?.id || !isDoctor) return;
        /** Cirurgia deve usar `openSurgery` ou resolução na página; evita abrir SOAP por engano. */
        if (isSurgeryServiceType(queuedConsultation.serviceType)) {
            router.replace(`/medical-records/${patient.id}`, { scroll: false });
            return;
        }

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
                wfRaw === "generic" ||
                wfRaw === "exam_review" ||
                wfRaw === "procedure" ||
                wfRaw === "consultation" ||
                wfRaw === "return"
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fila só reage ao id do enfileiramento
    }, [queuedConsultation?.id, isDoctor, patient.id, router]);

    useEffect(() => {
        if (!queuedSurgery?.id || !isDoctor) return;

        let cancelled = false;

        (async () => {
            const claim = await claimSurgeryAction(queuedSurgery.id, patient.id);
            if (cancelled) return;

            if (!claim.success) {
                toast.error(typeof claim.error === "string" ? claim.error : "Não foi possível abrir a cirurgia.");
                router.replace(`/medical-records/${patient.id}`, { scroll: false });
                return;
            }

            setActiveSurgeryId(queuedSurgery.id);
            setSurgeryFormOpen(true);
            router.replace(`/medical-records/${patient.id}`, { scroll: false });
        })();

        return () => {
            cancelled = true;
        };
    }, [queuedSurgery?.id, isDoctor, patient.id, router]);

    const mergedTimeline = useMemo((): MedicalTimelineRow[] => {
        const cRows: MedicalTimelineRow[] = consultations.map((c) => ({
            ...c,
            timelineKind: "consultation" as const,
            serviceTypeWorkflow: c.serviceTypeWorkflow,
            serviceTypeSlug: c.serviceTypeSlug,
            serviceTypeTimelineIconKey: c.serviceTypeTimelineIconKey,
            serviceTypeTimelineColorHex: c.serviceTypeTimelineColorHex,
            hasReturn: c.hasReturn,
            parentConsultationId: c.parentConsultationId,
            healthInsuranceId: c.healthInsuranceId,
        }));
        return [...cRows, ...surgeries].sort((a, b) => {
            const ta = new Date(a.startTime).getTime();
            const tb = new Date(b.startTime).getTime();
            return tb - ta;
        });
    }, [consultations, surgeries]);

    const patientForContext = useMemo(
        () => ({
            ...patient,
            lastConsultationDate: mergedTimeline[0]?.startTime ?? null,
        }),
        [patient, mergedTimeline]
    );

    const filteredTimeline = useMemo(() => {
        const q = normalizeForSearch(searchTerm.trim());
        let list = mergedTimeline;
        if (q) {
            list = list.filter((c) => {
                const doctor = normalizeForSearch(c.doctorName);
                const diagnosis = normalizeForSearch(c.diagnosis);
                const typeLabel = normalizeForSearch(c.serviceTypeName);
                const dateStr = normalizeForSearch(format(new Date(c.startTime), "dd MMM yyyy", { locale: ptBR }));
                const cid = normalizeForSearch(c.cidCode);
                return (
                    doctor.includes(q) ||
                    diagnosis.includes(q) ||
                    typeLabel.includes(q) ||
                    dateStr.includes(q) ||
                    cid.includes(q)
                );
            });
        }
        return list.filter((row) => timelineRowMatchesTypeFilter(row, typeFilter));
    }, [mergedTimeline, searchTerm, typeFilter]);

    const handleTimelineSelect = (id: string, kind: "consultation" | "surgery") => {
        if (kind === "consultation") {
            setSelectedConsultationId(id);
            return;
        }
        setSelectedConsultationId(null);
        setActiveSurgeryId(id);
        setSurgeryFormOpen(true);
    };

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
                    parentConsultationId: data.parentConsultationId ?? null,
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
            <aside className="flex min-h-[min(50vh,28rem)] w-full shrink-0 flex-col overflow-hidden border-b border-border bg-background lg:min-h-0 lg:w-[40%] lg:min-w-[20rem] lg:max-w-[44%] lg:border-b-0 lg:border-r">
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
                <div className="border-b bg-muted/30 px-5 py-2 md:px-8">
                    <h2 className="text-center text-lg font-bold leading-relaxed text-muted-foreground">
                        Registros de Atendimentos
                    </h2>
                    {isDoctor ? (
                        <p className="mx-auto mt-1 max-w-2xl text-center text-xs leading-snug text-muted-foreground">
                            <span className="font-medium text-foreground">Retorno:</span> em atendimentos{" "}
                            <span className="font-medium text-foreground">Concluídos</span> use o botão{" "}
                            <span className="font-medium text-foreground">Retorno</span> no próprio card (ou abra o
                            detalhe e use o botão no topo do painel).{" "}
                            <span className="font-medium text-foreground">+ Novo Atendimento</span> é para atendimento
                            novo, não retorno.
                        </p>
                    ) : null}
                </div>

                <div className="w-full flex-1 overflow-y-auto p-5 md:p-8">
                    <ConsultationTimeline
                        consultations={filteredTimeline}
                        onSelect={handleTimelineSelect}
                        onRequestReturn={
                            isDoctor
                                ? ({ consultationId, healthInsuranceId }) =>
                                      void openReturnFormForParent(consultationId, healthInsuranceId)
                                : undefined
                        }
                        isRequestReturnLoading={isStartingReturn}
                    />
                </div>

                <FileUploadModal
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    patientId={patient.id}
                    surgeryId={surgeryFormOpen && activeSurgeryId ? activeSurgeryId : null}
                    onSuccess={refreshAll}
                />
            </main>

            <ConsultationDetailSheet
                consultationId={selectedConsultationId}
                onClose={() => setSelectedConsultationId(null)}
                onEdit={handleEditConsultation}
                onStartReturn={handleStartReturn}
                isDoctor={isDoctor}
                isReturnStarting={isStartingReturn}
                onSelectConsultation={(id) => setSelectedConsultationId(id)}
                patientId={patient.id}
                currentDoctorId={currentDoctorId}
                canDeleteAsAdmin={canDeleteClinicalRecordsAsAdmin}
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
                onSurgeryFlowStarted={({ surgeryId }) => {
                    setActiveSurgeryId(surgeryId);
                    setSurgeryFormOpen(true);
                    setIsFormOpen(false);
                    refreshAll();
                }}
            />

            {activeSurgeryId ? (
                <SurgeryForm
                    isOpen={surgeryFormOpen}
                    onClose={() => {
                        setSurgeryFormOpen(false);
                        setActiveSurgeryId(null);
                    }}
                    surgeryId={activeSurgeryId}
                    patientId={patient.id}
                    patientName={patient.name}
                    doctors={doctors}
                    hospitals={hospitals}
                    procedures={procedures}
                    healthInsurances={healthInsurances}
                    currentDoctorId={currentDoctorId}
                    canDeleteAsAdmin={canDeleteClinicalRecordsAsAdmin}
                    onSaved={refreshAll}
                />
            ) : null}
        </div>
    );
}
