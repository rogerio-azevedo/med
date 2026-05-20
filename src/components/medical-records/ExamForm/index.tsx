"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactSelect, { type SingleValue, type StylesConfig } from "react-select";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { accentInsensitiveSelectFilter } from "@/lib/search-normalize";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    addExamProcedureAction,
    createExamAction,
    finishExamAction,
    removeExamProcedureAction,
    updateExamNotesAction,
} from "@/app/actions/exams";
import { Loader2, FlaskConical, X } from "lucide-react";

export type ExamFormProcedureOption = {
    id: string;
    name: string;
    type: string;
};

export type ExamFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clinicId: string;
    patientId: string;
    patientName?: string;
    consultationId?: string | null;
    healthInsuranceId?: string | null;
    serviceTypes: { id: string; name: string; workflow: string | null; slug?: string | null }[];
    healthInsurances: { id: string; name: string }[];
    doctors: { id: string; name: string | null }[];
    procedures: ExamFormProcedureOption[];
    currentDoctorId?: string;
    onSaved?: () => void;
    /** Ao abrir, retoma esse exame `in_progress`: etapa “Registrar”, procedimentos e notas já salvos. */
    resumeExamId?: string | null;
    /** Abre esse exame para editar notas/procedimentos já salvos (`finished` ou revisão em `in_progress`). */
    editExamId?: string | null;
};

type RsOption = { value: string; label: string };

type ProcedureLine = { linkId: string; procedureId: string; name: string };

export function ExamForm({
    open,
    onOpenChange,
    clinicId,
    patientId,
    patientName,
    consultationId = null,
    healthInsuranceId: initialHealthInsuranceId = null,
    serviceTypes,
    healthInsurances,
    doctors,
    procedures,
    currentDoctorId,
    onSaved,
    resumeExamId = null,
    editExamId = null,
}: ExamFormProps) {
    const [step, setStep] = useState<"setup" | "record">("setup");
    const [busy, setBusy] = useState(false);
    const [examId, setExamId] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [lines, setLines] = useState<ProcedureLine[]>([]);

    const [serviceTypeId, setServiceTypeId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [location, setLocation] = useState<"in_clinic" | "external">("in_clinic");
    const [healthInsuranceId, setHealthInsuranceId] = useState<string>(
        initialHealthInsuranceId ?? ""
    );
    const [procedureSelectKey, setProcedureSelectKey] = useState(0);
    const [addingProcedure, setAddingProcedure] = useState(false);
    const [removingLinkId, setRemovingLinkId] = useState<string | null>(null);
    /** Fluxo novo: sempre pronto; retoma/edita: false até GET `/api/exams/:id`. */
    const [existingExamFetchDone, setExistingExamFetchDone] = useState(() => !resumeExamId && !editExamId);
    /** Se `finished` ao carregar pela rota “editar”, footer usa “salvar alterações” em vez só de “finalizar”. */
    const [existingExamWasFinishedOnLoad, setExistingExamWasFinishedOnLoad] = useState(false);

    const appointmentLikeRsStyles = useMemo<StylesConfig<RsOption, false>>(
        () => ({
            control: (base) => ({
                ...base,
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                padding: "2px",
                boxShadow: "none",
            }),
        }),
        []
    );

    const typeOptions = useMemo(() => {
        const examish = serviceTypes.filter(
            (s) =>
                s.workflow === "exam_review" ||
                (s.slug?.toLowerCase().includes("exam") ?? false) ||
                s.name.toLowerCase().includes("exame")
        );
        return examish.length ? examish : serviceTypes;
    }, [serviceTypes]);

    const serviceTypeRsOptions: RsOption[] = useMemo(
        () => typeOptions.map((s) => ({ value: s.id, label: s.name })),
        [typeOptions]
    );

    const doctorRsOptions: RsOption[] = useMemo(
        () => doctors.map((d) => ({ value: d.id, label: d.name ?? "Sem nome" })),
        [doctors]
    );

    const healthInsuranceRsOptions: RsOption[] = useMemo(
        () => healthInsurances.map((h) => ({ value: h.id, label: h.name })),
        [healthInsurances]
    );

    const locationRsOptions: RsOption[] = useMemo(
        () => [
            { value: "in_clinic", label: "Na clínica" },
            { value: "external", label: "Externo" },
        ],
        []
    );

    const catalogForPicker = useMemo(() => {
        const onlyExam = procedures.filter((p) => p.type === "exam");
        return onlyExam.length ? onlyExam : procedures;
    }, [procedures]);

    const procedureRsOptions: RsOption[] = useMemo(
        () => catalogForPicker.map((p) => ({ value: p.id, label: p.name })),
        [catalogForPicker]
    );

    const reset = useCallback(() => {
        setStep("setup");
        setExamId(null);
        setNotes("");
        setLines([]);
        setServiceTypeId("");
        setDoctorId(currentDoctorId ?? doctors[0]?.id ?? "");
        setLocation("in_clinic");
        setHealthInsuranceId(initialHealthInsuranceId ?? "");
        setProcedureSelectKey((k) => k + 1);
        setAddingProcedure(false);
        setRemovingLinkId(null);
        setExistingExamFetchDone(true);
        setExistingExamWasFinishedOnLoad(false);
    }, [currentDoctorId, doctors, initialHealthInsuranceId]);

    /** Carrega exame já existente antes de liberar UI de registro (retoma `in_progress` ou edita gravado). */
    useEffect(() => {
        const mode = resumeExamId ? ("resume" as const) : editExamId ? ("edit" as const) : null;
        const targetId = resumeExamId ?? editExamId ?? null;

        if (!open || !targetId || !mode) {
            return;
        }

        let aborted = false;

        void (async () => {
            setExistingExamFetchDone(false);
            try {
                const res = await fetch(`/api/exams/${targetId}`);
                if (!res.ok) {
                    if (!aborted) {
                        toast.error(res.status === 404 ? "Exame não encontrado." : "Erro ao carregar o exame.");
                        onOpenChange(false);
                    }
                    return;
                }
                const data = (await res.json()) as {
                    id: string;
                    patientId?: string | null;
                    status?: string;
                    notes?: string | null;
                    procedureLinks?: Array<{
                        id: string;
                        procedure: { id: string; name: string };
                    }>;
                };
                if (aborted) return;

                const rowPatientId = data.patientId ?? null;
                if (rowPatientId && rowPatientId !== patientId) {
                    toast.error("Este registro não corresponde a este paciente.");
                    onOpenChange(false);
                    return;
                }
                const st = data.status;

                if (mode === "resume") {
                    if (st !== "in_progress") {
                        toast.warning(
                            "Este exame não está mais em andamento — abra apenas para visualização no histórico."
                        );
                        onOpenChange(false);
                        return;
                    }
                    setExistingExamWasFinishedOnLoad(false);
                } else if (mode === "edit") {
                    if (!st || (st !== "finished" && st !== "in_progress")) {
                        toast.warning("Este exame não pode ser editado neste estado.");
                        onOpenChange(false);
                        return;
                    }
                    setExistingExamWasFinishedOnLoad(st === "finished");
                }

                setExamId(data.id);
                setNotes(data.notes ?? "");
                setLines(
                    (data.procedureLinks ?? []).map((pl) => ({
                        linkId: pl.id,
                        procedureId: pl.procedure.id,
                        name: pl.procedure.name,
                    }))
                );
                setStep("record");
                setProcedureSelectKey((k) => k + 1);
                setExistingExamFetchDone(true);
            } catch {
                if (!aborted) {
                    toast.error("Erro ao carregar o exame.");
                    onOpenChange(false);
                }
            }
        })();

        return () => {
            aborted = true;
        };
    }, [open, resumeExamId, editExamId, patientId, onOpenChange]);
    useEffect(() => {
        if (!open) reset();
    }, [open, reset]);

    useEffect(() => {
        if (open) {
            setDoctorId(currentDoctorId ?? doctors[0]?.id ?? "");
            setHealthInsuranceId(initialHealthInsuranceId ?? "");
        }
    }, [open, currentDoctorId, doctors, initialHealthInsuranceId]);

    /** Só faz sentido perguntar quando a clínica tem mais de um tipo de atendimento “de exame” cadastrado. */
    const needsServiceTypeChoice = serviceTypeRsOptions.length > 1;

    useEffect(() => {
        if (open && serviceTypeRsOptions.length === 1) {
            setServiceTypeId(serviceTypeRsOptions[0].value);
        }
    }, [open, serviceTypeRsOptions]);

    const handleContinue = async () => {
        setBusy(true);
        try {
            const res = await createExamAction({
                patientId,
                clinicId,
                consultationId,
                doctorId: doctorId || null,
                serviceTypeId: serviceTypeId || null,
                healthInsuranceId: healthInsuranceId || null,
                location,
                status: "in_progress",
            });
            if (!res.success) {
                toast.error(typeof res.error === "string" ? res.error : "Não foi possível iniciar o exame.");
                return;
            }
            const created = "exam" in res ? res.exam : null;
            if (!created?.id) {
                toast.error("Resposta inválida ao criar exame.");
                return;
            }
            setExamId(created.id);
            setStep("record");
            toast.success("Registro de exame iniciado.");
        } finally {
            setBusy(false);
        }
    };

    const handleAddProcedureFromPicker = async (procedureId: string) => {
        if (!examId || addingProcedure || !procedureId.trim()) return;
        if (lines.some((l) => l.procedureId === procedureId)) return;

        const proc = catalogForPicker.find((p) => p.id === procedureId);
        if (!proc) return;

        setAddingProcedure(true);
        try {
            const res = await addExamProcedureAction(examId, patientId, {
                procedureId,
                quantity: 1,
            });
            if (!res.success) {
                toast.error(typeof res.error === "string" ? res.error : "Erro ao adicionar procedimento.");
                return;
            }
            const link = "procedureLink" in res ? res.procedureLink : null;
            if (!link?.id) {
                toast.error("Resposta inválida ao adicionar procedimento.");
                return;
            }
            setLines((prev) => [
                ...prev,
                { linkId: link.id, procedureId: proc.id, name: proc.name },
            ]);
            setProcedureSelectKey((k) => k + 1);
        } finally {
            setAddingProcedure(false);
        }
    };

    const handleRemoveLine = async (linkId: string) => {
        if (!examId || removingLinkId) return;
        setRemovingLinkId(linkId);
        try {
            const res = await removeExamProcedureAction(examId, patientId, linkId);
            if (!res.success) {
                toast.error(typeof res.error === "string" ? res.error : "Erro ao remover.");
                return;
            }
            setLines((prev) => prev.filter((l) => l.linkId !== linkId));
        } finally {
            setRemovingLinkId(null);
        }
    };

    const handleSaveExamRecordEdits = async () => {
        if (!examId) return;
        setBusy(true);
        try {
            const noteRes = await updateExamNotesAction(examId, patientId, notes.trim() || null);
            if (!noteRes.success) {
                toast.error(noteRes.error ?? "Erro ao salvar notas.");
                return;
            }
            toast.success("Alterações salvas.");
            onOpenChange(false);
            onSaved?.();
        } finally {
            setBusy(false);
        }
    };

    const handleFinish = async () => {
        if (!examId) return;
        setBusy(true);
        try {
            const noteRes = await updateExamNotesAction(examId, patientId, notes.trim() || null);
            if (!noteRes.success) {
                toast.error(noteRes.error ?? "Erro ao salvar notas.");
                return;
            }
            const fin = await finishExamAction(examId, patientId);
            if (!fin.success) {
                toast.error(fin.error ?? "Erro ao finalizar.");
                return;
            }
            toast.success("Exame registrado e finalizado.");
            onOpenChange(false);
            onSaved?.();
        } finally {
            setBusy(false);
        }
    };

    const titleSuffix = patientName ? `: ${patientName}` : "";

    const selectedServiceType = serviceTypeRsOptions.find((o) => o.value === serviceTypeId) ?? null;
    const selectedDoctor = doctorRsOptions.find((o) => o.value === doctorId) ?? null;
    const selectedLocation = locationRsOptions.find((o) => o.value === location) ?? locationRsOptions[0];
    const selectedInsurance =
        healthInsuranceId === ""
            ? null
            : (healthInsuranceRsOptions.find((o) => o.value === healthInsuranceId) ?? null);
    const lineProcedureIds = useMemo(() => new Set(lines.map((l) => l.procedureId)), [lines]);

    const availableProcedureOptions = useMemo(
        () => procedureRsOptions.filter((o) => !lineProcedureIds.has(o.value)),
        [procedureRsOptions, lineProcedureIds]
    );


    const insuranceOptionsWithClear: RsOption[] = useMemo(
        () => [{ value: "", label: "Particular / não informado" }, ...healthInsuranceRsOptions],
        [healthInsuranceRsOptions]
    );

    const rsPanelCommon = useMemo(
        () => ({
            classNamePrefix: "rs" as const,
            styles: appointmentLikeRsStyles,
            filterOption: accentInsensitiveSelectFilter,
        }),
        [appointmentLikeRsStyles]
    );

    const blockingWhileLoadingExisting =
        open && (!!resumeExamId || !!editExamId) && !existingExamFetchDone;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex min-h-0 h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
            >
                <SheetHeader className="shrink-0 border-b px-6 py-4">
                    <SheetTitle>
                        {step === "setup"
                            ? `Novo exame${titleSuffix}`
                            : editExamId
                              ? `Editar exame${titleSuffix}`
                              : `Registrar exame${titleSuffix}`}
                    </SheetTitle>
                </SheetHeader>

                {blockingWhileLoadingExisting ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-muted-foreground">
                        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                        <p className="text-center text-sm">
                            {editExamId
                                ? "Carregando exame para edição…"
                                : "Carregando exame para continuar o registro…"}
                        </p>
                    </div>
                ) : step === "setup" ? (
                    <>
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
                            {needsServiceTypeChoice ? (
                                <div className="space-y-2">
                                    <Label>Tipo de atendimento na clínica</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Use quando existir mais de um cadastro de tipo ligado a exames (relatórios,
                                        convênio ou fluxo).
                                    </p>
                                    <ReactSelect<RsOption, false>
                                        placeholder="Opcional"
                                        isClearable
                                        options={serviceTypeRsOptions}
                                        value={selectedServiceType}
                                        onChange={(opt: SingleValue<RsOption>) =>
                                            setServiceTypeId(opt?.value ?? "")
                                        }
                                        {...rsPanelCommon}
                                    />
                                </div>
                            ) : null}
                            <div className="space-y-2">
                                <Label>Médico executor</Label>
                                <ReactSelect<RsOption, false>
                                    placeholder="Selecione ou deixe em branco"
                                    isClearable
                                    options={doctorRsOptions}
                                    value={selectedDoctor}
                                    onChange={(opt: SingleValue<RsOption>) => setDoctorId(opt?.value ?? "")}
                                    noOptionsMessage={() =>
                                        doctors.length === 0
                                            ? "Nenhum médico cadastrado na clínica"
                                            : "Nenhuma opção"
                                    }
                                    {...rsPanelCommon}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Local</Label>
                                <ReactSelect<RsOption, false>
                                    placeholder="Local"
                                    isSearchable={false}
                                    options={locationRsOptions}
                                    value={selectedLocation}
                                    onChange={(opt: SingleValue<RsOption>) =>
                                        setLocation((opt?.value as "in_clinic" | "external") ?? "in_clinic")
                                    }
                                    {...rsPanelCommon}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Convênio</Label>
                                <ReactSelect<RsOption, false>
                                    placeholder="Convênio"
                                    isSearchable={healthInsuranceRsOptions.length > 6}
                                    options={insuranceOptionsWithClear}
                                    value={
                                        healthInsuranceId === ""
                                            ? insuranceOptionsWithClear[0]
                                            : selectedInsurance
                                    }
                                    onChange={(opt: SingleValue<RsOption>) =>
                                        setHealthInsuranceId(opt?.value === "" ? "" : (opt?.value ?? ""))
                                    }
                                    {...rsPanelCommon}
                                />
                            </div>
                            {consultationId ? (
                                <p className="text-xs text-muted-foreground">
                                    Vinculado ao atendimento em aberto (consulta atual).
                                </p>
                            ) : null}
                        </div>
                        <SheetFooter className="mt-0 shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                disabled={busy || blockingWhileLoadingExisting}
                                onClick={() => void handleContinue()}
                            >
                                {busy ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Iniciando…
                                    </>
                                ) : (
                                    "Continuar"
                                )}
                            </Button>
                        </SheetFooter>
                    </>
                ) : (
                    <>
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
                            <div className="space-y-3">
                                <Label>Procedimentos (catálogo TUSS)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Busque e selecione para incluir à lista — não é necessário clicar em outro botão.
                                </p>
                                <ReactSelect<RsOption, false>
                                    key={`proc-picker-${procedureSelectKey}`}
                                    placeholder={
                                        catalogForPicker.length === 0
                                            ? "Nenhum procedimento no catálogo"
                                            : "Buscar procedimento TUSS para adicionar…"
                                    }
                                    isClearable={false}
                                    menuPlacement="bottom"
                                    options={availableProcedureOptions}
                                    value={null}
                                    isDisabled={busy || addingProcedure || catalogForPicker.length === 0}
                                    isLoading={addingProcedure}
                                    onChange={(opt: SingleValue<RsOption>) => {
                                        const id = opt?.value;
                                        if (!id) return;
                                        void handleAddProcedureFromPicker(id);
                                    }}
                                    noOptionsMessage={() =>
                                        catalogForPicker.length === 0
                                            ? "Nenhum procedimento no catálogo"
                                            : lineProcedureIds.size >= procedureRsOptions.length
                                              ? "Todos os procedimentos desta lista já foram adicionados"
                                              : "Nenhuma opção"
                                    }
                                    {...rsPanelCommon}
                                />
                                {lines.length === 0 ? (
                                    <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                                        Nenhum procedimento adicionado
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {lines.map((l) => {
                                            const removing = removingLinkId === l.linkId;
                                            return (
                                                <li
                                                    key={l.linkId}
                                                    className="flex min-w-0 items-start gap-3 rounded-lg border bg-card px-4 py-3"
                                                >
                                                    <FlaskConical
                                                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                                        aria-hidden
                                                    />
                                                    <span
                                                        className="min-w-0 flex-1 truncate text-sm leading-snug"
                                                        title={l.name}
                                                    >
                                                        {l.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="-m-1 shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none"
                                                        aria-label={`Remover ${l.name}`}
                                                        disabled={
                                                            addingProcedure || removingLinkId !== null
                                                        }
                                                        onClick={() => void handleRemoveLine(l.linkId)}
                                                    >
                                                        {removing ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <X className="size-4" />
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Registro / laudo (texto livre)</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Descreva o exame realizado, achados e conclusões…"
                                    className="min-h-[min(280px,36vh)] text-sm"
                                />
                            </div>
                        </div>
                        <SheetFooter className="mt-0 shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between">
                            {!resumeExamId && !editExamId ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={busy || addingProcedure || removingLinkId !== null}
                                    onClick={() => setStep("setup")}
                                >
                                    Voltar
                                </Button>
                            ) : (
                                <span className="hidden sm:inline sm:flex-1" aria-hidden />
                            )}
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={addingProcedure || removingLinkId !== null}
                                    onClick={() => onOpenChange(false)}
                                >
                                    Fechar
                                </Button>
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                    {editExamId ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={
                                                busy ||
                                                addingProcedure ||
                                                removingLinkId !== null ||
                                                !examId
                                            }
                                            onClick={() => void handleSaveExamRecordEdits()}
                                        >
                                            {busy ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Salvando…
                                                </>
                                            ) : (
                                                "Salvar alterações"
                                            )}
                                        </Button>
                                    ) : null}
                                    {!existingExamWasFinishedOnLoad ? (
                                        <Button
                                            type="button"
                                            disabled={
                                                busy ||
                                                addingProcedure ||
                                                removingLinkId !== null ||
                                                !examId
                                            }
                                            onClick={() => void handleFinish()}
                                        >
                                            {busy ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Salvando…
                                                </>
                                            ) : (
                                                "Finalizar exame"
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
