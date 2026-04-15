"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Select from "react-select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icd10Search } from "../Icd10Search";
import { PlanTab } from "./PlanTab";
import {
    ArrowLeft,
    ClipboardList,
    Microscope,
    Stethoscope,
    User,
    Video,
    Scissors,
    FlaskConical,
    FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
    getServiceTypeWorkflowLabel,
    type ServiceTypeWorkflow,
} from "@/lib/service-type-workflows";
import { cn } from "@/lib/utils";
import { startConsultationAction } from "@/app/actions/consultations";

type PatientOption = {
    id: string;
    name: string;
};

type SoapState = {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    diagnosisCidId: string | null;
    diagnosisCode: string;
    diagnosisDescription: string;
    diagnosisFreeText: string;
};

type VitalsState = {
    weight: string;
    height: string;
    bloodPressure: string;
    heartRate: string;
    temperature: string;
};

export type ConsultationFormSubmitData = {
    patientId: string;
    serviceTypeId: string;
    healthInsuranceId: string | null;
    workflow: ServiceTypeWorkflow | null;
    soap: SoapState;
    vitals: VitalsState;
    /** Present after "Continuar" on a new encounter or when editing an existing one. */
    consultationId?: string | null;
};

type ServiceTypeOption = {
    id: string;
    name: string;
    workflow: ServiceTypeWorkflow;
    slug?: string | null;
};

type HealthInsuranceOption = {
    id: string;
    name: string;
};

type ConsultationInitialData = {
    id?: string;
    soap: Partial<SoapState> & {
        diagnosisCid?: {
            code?: string | null;
            description?: string | null;
        } | null;
    };
    vitals: Partial<VitalsState>;
    serviceTypeId?: string | null;
    serviceTypeName?: string | null;
    serviceTypeWorkflow?: ServiceTypeWorkflow | null;
    healthInsuranceId?: string | null;
} | null;

interface ConsultationFormProps {
    patient?: PatientOption | null;
    patients?: PatientOption[];
    serviceTypes: ServiceTypeOption[];
    healthInsurances: HealthInsuranceOption[];
    clinicId: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ConsultationFormSubmitData) => void;
    initialData?: ConsultationInitialData;
}

type Option = {
    value: string;
    label: string;
};

/** Mapeia nomes/workflows a ícones lucide-react. */
function getServiceTypeIcon(name: string, workflow: ServiceTypeWorkflow) {
    const lower = name.toLowerCase();
    if (lower.includes("video") || lower.includes("vídeo")) return Video;
    if (lower.includes("ciru")) return Scissors;
    if (lower.includes("exam")) return FlaskConical;
    if (workflow === "consultation") return Stethoscope;
    if (workflow === "procedure") return ClipboardList;
    if (workflow === "exam_review") return Microscope;
    return FileText;
}

export function ConsultationForm({
    patient,
    patients = [],
    serviceTypes,
    healthInsurances,
    clinicId,
    isOpen,
    onClose,
    onSubmit,
    initialData,
}: ConsultationFormProps) {
    const isEditing = !!initialData?.id;

    // Default automático: primeiro tipo com slug === "consultation", fallback para workflow, e por último o primeiro da lista
    const defaultServiceTypeId =
        initialData?.serviceTypeId ||
        serviceTypes.find((s) => s.slug === "consultation")?.id ||
        serviceTypes.find((s) => s.workflow === "consultation")?.id ||
        serviceTypes[0]?.id ||
        "";

    const [step, setStep] = useState<"setup" | "record">(isEditing ? "record" : "setup");
    const [activeTab, setActiveTab] = useState("subjective");
    const [selectedPatientId, setSelectedPatientId] = useState(patient?.id || "");
    const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(defaultServiceTypeId);
    const [selectedHealthInsuranceId, setSelectedHealthInsuranceId] = useState(
        initialData?.healthInsuranceId || ""
    );
    const [soap, setSoap] = useState({
        subjective: initialData?.soap?.subjective || "",
        objective: initialData?.soap?.objective || "",
        assessment: initialData?.soap?.assessment || "",
        plan: initialData?.soap?.plan || "",
        diagnosisCidId: initialData?.soap?.diagnosisCidId || null as string | null,
        diagnosisCode: initialData?.soap?.diagnosisCid?.code || "",
        diagnosisDescription: initialData?.soap?.diagnosisCid?.description || "",
        diagnosisFreeText: initialData?.soap?.diagnosisFreeText || "",
    });
    const [vitals, setVitals] = useState({
        weight: initialData?.vitals?.weight || "",
        height: initialData?.vitals?.height || "",
        bloodPressure: initialData?.vitals?.bloodPressure || "",
        heartRate: initialData?.vitals?.heartRate || "",
        temperature: initialData?.vitals?.temperature || "",
    });

    /** Created when the user clicks Continue on a brand-new encounter (enables Plan / prescriptions). */
    const [liveConsultationId, setLiveConsultationId] = useState<string | null>(null);
    const [startingEncounter, setStartingEncounter] = useState(false);

    const effectiveConsultationId = initialData?.id ?? liveConsultationId ?? null;

    const allPatients = useMemo(
        () =>
            patient
                ? [{ id: patient.id, name: patient.name }, ...patients.filter((item) => item.id !== patient.id)]
                : patients,
        [patient, patients]
    );
    const patientOptions: Option[] = useMemo(
        () => allPatients.map((item) => ({ value: item.id, label: item.name })),
        [allPatients]
    );

    // Opções de convênio para react-select
    const insuranceOptions: Option[] = useMemo(
        () => [
            { value: "__none__", label: "Particular / Sem convênio" },
            ...healthInsurances.map((h) => ({ value: h.id, label: h.name })),
        ],
        [healthInsurances]
    );
    const selectedInsuranceOption =
        insuranceOptions.find((o) => o.value === (selectedHealthInsuranceId || "__none__")) ?? insuranceOptions[0];

    const selectedPatient = allPatients.find((item) => item.id === selectedPatientId) || patient || null;
    const selectedServiceType = serviceTypes.find((item) => item.id === selectedServiceTypeId) || null;
    const activeWorkflow = (initialData?.serviceTypeWorkflow || selectedServiceType?.workflow || null) as ServiceTypeWorkflow | null;

    const handleSelectCid = (cid: { id: string; code: string; description: string }) => {
        setSoap((prev) => ({
            ...prev,
            diagnosisCidId: cid.id,
            diagnosisCode: cid.code,
            diagnosisDescription: cid.description,
        }));
    };

    const recordMeta = getRecordMeta(activeWorkflow);
    // Pode continuar se paciente selecionado (tipo já tem default)
    const canContinue = !!selectedPatientId && !!selectedServiceTypeId;

    const handleContinueFromSetup = async () => {
        if (!canContinue) return;
        if (initialData?.id) {
            setStep("record");
            return;
        }
        setStartingEncounter(true);
        try {
            const res = await startConsultationAction({
                patientId: selectedPatientId,
                serviceTypeId: selectedServiceTypeId,
                healthInsuranceId: selectedHealthInsuranceId || null,
            });
            if (!res.success) {
                toast.error(typeof res.error === "string" ? res.error : "Erro ao iniciar atendimento.");
                return;
            }
            const created = "data" in res ? res.data : undefined;
            if (!created?.id) {
                toast.error("Resposta inválida ao iniciar atendimento.");
                return;
            }
            setLiveConsultationId(created.id);
            setStep("record");
        } finally {
            setStartingEncounter(false);
        }
    };

    // Estilos compartilhados para react-select
    const reactSelectStyles = {
        control: (base: Record<string, unknown>) => ({
            ...base,
            borderColor: "hsl(var(--border))",
            borderRadius: "0.5rem",
            padding: "2px",
            boxShadow: "none",
            "&:hover": { borderColor: "hsl(var(--border))" },
        }),
        menu: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 50,
        }),
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-6xl">
                <DialogHeader
                    className={cn(
                        "border-b p-6 pb-4",
                        // Evita sobreposição com o X absoluto do DialogContent (top-4 right-4)
                        !isEditing && step === "record" && "pr-14 sm:pr-16"
                    )}
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Stethoscope className="h-6 w-6 text-primary" />
                                {isEditing
                                    ? `Editar Atendimento: ${selectedPatient?.name || patient?.name || "Paciente"}`
                                    : step === "setup"
                                      ? "Novo Atendimento"
                                      : `Registrar Atendimento: ${selectedPatient?.name || "Paciente"}`}
                            </DialogTitle>
                            {step === "record" ? (
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline">{selectedServiceType?.name || initialData?.serviceTypeName || "Atendimento"}</Badge>
                                    {activeWorkflow ? (
                                        <Badge variant="secondary">{getServiceTypeWorkflowLabel(activeWorkflow)}</Badge>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Selecione o paciente, o tipo de atendimento e o convênio.
                                </p>
                            )}
                        </div>
                        {!isEditing && step === "record" ? (
                            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setStep("setup")}>
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        ) : null}
                    </div>
                </DialogHeader>

                {step === "setup" ? (
                    <div className="space-y-6 overflow-y-auto p-6">
                        {/* ── Paciente ─────────────────────────────────── */}
                        {!patient ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Paciente <span className="text-destructive">*</span></Label>
                                <Select
                                    placeholder="Buscar paciente..."
                                    options={patientOptions}
                                    value={patientOptions.find((option) => option.value === selectedPatientId) ?? null}
                                    onChange={(option) => setSelectedPatientId(option?.value ?? "")}
                                    classNamePrefix="rs"
                                    styles={reactSelectStyles}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Paciente</Label>
                                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm font-medium">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {patient.name}
                                </div>
                            </div>
                        )}

                        {/* ── Tipo de atendimento — cards clicáveis ─────── */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Tipo de atendimento <span className="text-destructive">*</span>
                            </Label>
                            <div
                                className={cn(
                                    "grid gap-3",
                                    serviceTypes.length <= 2
                                        ? "grid-cols-2"
                                        : serviceTypes.length === 3
                                          ? "grid-cols-3"
                                          : "grid-cols-2 sm:grid-cols-4"
                                )}
                            >
                                {serviceTypes.map((st) => {
                                    const Icon = getServiceTypeIcon(st.name, st.workflow);
                                    const isSelected = selectedServiceTypeId === st.id;
                                    return (
                                        <button
                                            key={st.id}
                                            type="button"
                                            onClick={() => setSelectedServiceTypeId(st.id)}
                                            className={cn(
                                                "group relative flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 px-3 py-5 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                                isSelected
                                                    ? "border-primary bg-primary/8 shadow-sm"
                                                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200",
                                                    isSelected
                                                        ? "bg-primary/15 text-primary"
                                                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-sm font-semibold leading-tight transition-colors duration-200",
                                                    isSelected
                                                        ? "text-primary"
                                                        : "text-foreground group-hover:text-primary"
                                                )}
                                            >
                                                {st.name}
                                            </span>
                                            {isSelected && (
                                                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Convênio — react-select ───────────────────── */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Convênio</Label>
                            <Select
                                options={insuranceOptions}
                                value={selectedInsuranceOption}
                                onChange={(option) =>
                                    setSelectedHealthInsuranceId(
                                        !option || option.value === "__none__" ? "" : option.value
                                    )
                                }
                                classNamePrefix="rs"
                                styles={reactSelectStyles}
                                placeholder="Particular / Sem convênio"
                                isClearable={selectedHealthInsuranceId !== ""}
                            />
                        </div>

                        {/* ── Preview do fluxo ─────────────────────────── */}
                        {selectedServiceType ? (
                            <Card className="border-dashed">
                                <CardContent className="space-y-2 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <ClipboardList className="h-4 w-4 text-primary" />
                                        Fluxo selecionado
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{selectedServiceType.name}</Badge>
                                        <Badge variant="secondary">{getServiceTypeWorkflowLabel(selectedServiceType.workflow)}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{recordMeta.description}</p>
                                </CardContent>
                            </Card>
                        ) : null}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                disabled={!canContinue || startingEncounter}
                                onClick={() => void handleContinueFromSetup()}
                            >
                                {startingEncounter ? "Iniciando…" : "Continuar"}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : activeWorkflow === "consultation" ? (
                    <>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col pt-4">
                            <div className="border-b px-6">
                                <TabsList className="h-12 w-full justify-start gap-6 rounded-none bg-transparent p-0">
                                    <TabsTrigger value="subjective" className="h-full rounded-none px-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">S</span>
                                        Subjetivo
                                    </TabsTrigger>
                                    <TabsTrigger value="objective" className="h-full rounded-none px-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">O</span>
                                        Objetivo
                                    </TabsTrigger>
                                    <TabsTrigger value="assessment" className="h-full rounded-none px-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">A</span>
                                        Avaliação
                                    </TabsTrigger>
                                    <TabsTrigger value="plan" className="h-full rounded-none px-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">P</span>
                                        Plano
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <TabsContent value="subjective" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-lg font-semibold">Queixa Principal e História (HDA)</Label>
                                        <Textarea
                                            placeholder="Descreva o motivo da consulta, sintomas e histórico atual..."
                                            className="min-h-[400px] text-base"
                                            value={soap.subjective}
                                            onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="objective" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                                        <div className="space-y-2">
                                            <Label>Peso (kg)</Label>
                                            <Input placeholder="70.5" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Altura (cm)</Label>
                                            <Input placeholder="175" value={vitals.height} onChange={(e) => setVitals({ ...vitals, height: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>PA (mmHg)</Label>
                                            <Input placeholder="120/80" value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>FC (bpm)</Label>
                                            <Input placeholder="72" value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Temp (°C)</Label>
                                            <Input placeholder="36.5" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-lg font-semibold">Exame Físico</Label>
                                        <Textarea
                                            placeholder="Descreva os achados do exame físico..."
                                            className="min-h-[300px]"
                                            value={soap.objective}
                                            onChange={(e) => setSoap({ ...soap, objective: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="assessment" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-lg font-semibold italic">Diagnóstico / Hipótese Diagnóstica (CID-10)</Label>
                                            <Icd10Search onSelect={handleSelectCid} />
                                            {soap.diagnosisCode ? (
                                                <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className="h-8 text-md">{soap.diagnosisCode}</Badge>
                                                        <span className="font-medium">{soap.diagnosisDescription}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setSoap({ ...soap, diagnosisCidId: null, diagnosisCode: "", diagnosisDescription: "" })}>
                                                        Remover
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label className="text-lg font-semibold">Avaliação Clínica / Observações</Label>
                                            <Textarea
                                                placeholder="Discuta o raciocínio clínico, gravidade e prognóstico..."
                                                className="min-h-[300px]"
                                                value={soap.assessment}
                                                onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="plan" className="mt-0 space-y-6">
                                    <PlanTab
                                        planValue={soap.plan}
                                        onPlanChange={(plan) => setSoap({ ...soap, plan })}
                                        consultationId={effectiveConsultationId}
                                        patientId={selectedPatientId}
                                        clinicId={clinicId}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>

                        <DialogFooter className="gap-3 border-t p-6">
                            <Button variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button
                                onClick={() =>
                                    onSubmit({
                                        patientId: selectedPatientId,
                                        serviceTypeId: selectedServiceTypeId,
                                        healthInsuranceId: selectedHealthInsuranceId || null,
                                        workflow: activeWorkflow,
                                        soap,
                                        vitals,
                                        consultationId: effectiveConsultationId,
                                    })
                                }
                            >
                                Finalizar e Salvar Atendimento
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                <Card className="border-dashed">
                                    <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2 font-semibold text-foreground">
                                            <User className="h-4 w-4 text-primary" />
                                            {selectedPatient?.name || "Paciente"}
                                        </div>
                                        <p>{recordMeta.description}</p>
                                    </CardContent>
                                </Card>

                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">{recordMeta.titleLabel}</Label>
                                    <Input
                                        placeholder={recordMeta.titlePlaceholder}
                                        value={soap.diagnosisFreeText}
                                        onChange={(e) => setSoap({ ...soap, diagnosisFreeText: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">{recordMeta.primaryLabel}</Label>
                                    <Textarea
                                        placeholder={recordMeta.primaryPlaceholder}
                                        className="min-h-[300px]"
                                        value={soap.assessment}
                                        onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">{recordMeta.secondaryLabel}</Label>
                                    <Textarea
                                        placeholder={recordMeta.secondaryPlaceholder}
                                        className="min-h-[250px]"
                                        value={soap.plan}
                                        onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-3 border-t p-6">
                            <Button variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button
                                onClick={() =>
                                    onSubmit({
                                        patientId: selectedPatientId,
                                        serviceTypeId: selectedServiceTypeId,
                                        healthInsuranceId: selectedHealthInsuranceId || null,
                                        workflow: activeWorkflow,
                                        soap,
                                        vitals,
                                        consultationId: effectiveConsultationId,
                                    })
                                }
                            >
                                Salvar Atendimento
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function getRecordMeta(workflow: ServiceTypeWorkflow | null) {
    switch (workflow) {
        case "procedure":
            return {
                description: "Registre de forma objetiva o procedimento executado, intercorrências e orientações finais.",
                titleLabel: "Nome do procedimento",
                titlePlaceholder: "Ex: Infiltração articular guiada",
                primaryLabel: "Descrição técnica",
                primaryPlaceholder: "Descreva o procedimento realizado, materiais, técnica e evolução imediata.",
                secondaryLabel: "Orientações e observações",
                secondaryPlaceholder: "Registre orientações pós-procedimento, recomendações e próximos passos.",
            };
        case "exam_review":
            return {
                description: "Use este fluxo para documentar análise de exames, interpretação clínica e devolutiva ao paciente.",
                titleLabel: "Conclusão da revisão",
                titlePlaceholder: "Ex: Revisão de ressonância lombar",
                primaryLabel: "Achados relevantes",
                primaryPlaceholder: "Descreva os exames avaliados e os pontos clínicos mais importantes.",
                secondaryLabel: "Conduta",
                secondaryPlaceholder: "Registre devolutiva, próximos exames, retorno ou ajustes de tratamento.",
            };
        default:
            return {
                description: "Fluxo resumido para registrar atendimentos que ainda não possuem formulário clínico dedicado.",
                titleLabel: "Resumo do atendimento",
                titlePlaceholder: "Ex: Orientação pós-operatória",
                primaryLabel: "Registro principal",
                primaryPlaceholder: "Descreva o que foi realizado neste atendimento.",
                secondaryLabel: "Observações complementares",
                secondaryPlaceholder: "Adicione informações complementares, orientações e encaminhamentos.",
            };
    }
}
