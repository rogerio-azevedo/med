"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSurgeryAction, getSurgeryDetailsAction, saveSurgeryAction } from "@/app/actions/surgeries";
import type { SurgeryStatusValue } from "@/lib/validations/surgeries";
import { BasicDataSection } from "./BasicDataSection";
import { LocationAndInsuranceSection } from "./LocationAndInsuranceSection";
import { MedicalTeamSection, type TeamField } from "./MedicalTeamSection";
import { FinancialSection, type RepasseField } from "./FinancialSection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";

type DoctorOpt = { id: string; name: string | null };
type HospitalOpt = { id: string; name: string };
type ProcedureOpt = { id: string; name: string };
type InsuranceOpt = { id: string; name: string };

export interface SurgeryFormProps {
    isOpen: boolean;
    onClose: () => void;
    surgeryId: string;
    patientId: string;
    patientName: string;
    doctors: DoctorOpt[];
    hospitals: HospitalOpt[];
    procedures: ProcedureOpt[];
    healthInsurances: InsuranceOpt[];
    onSaved: () => void;
    currentDoctorId?: string;
    /** Admin da clínica pode excluir registro de cirurgia */
    canDeleteAsAdmin?: boolean;
}

function formatDateInput(d: Date | string | null | undefined): string {
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 10);
    return d.toISOString().slice(0, 10);
}

export function SurgeryForm({
    isOpen,
    onClose,
    surgeryId,
    patientId,
    patientName,
    doctors,
    hospitals,
    procedures,
    healthInsurances,
    onSaved,
    currentDoctorId,
    canDeleteAsAdmin = false,
}: SurgeryFormProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const formScrollRef = useRef<HTMLDivElement>(null);

    const [surgeryDate, setSurgeryDate] = useState("");
    const [status, setStatus] = useState<SurgeryStatusValue>("scheduled");
    const [procedureIds, setProcedureIds] = useState<string[]>([]);
    const [hospitalId, setHospitalId] = useState("");
    const [healthInsuranceId, setHealthInsuranceId] = useState("");
    const [surgeonId, setSurgeonId] = useState("");
    const [firstAuxId, setFirstAuxId] = useState("");
    const [secondAuxId, setSecondAuxId] = useState("");
    const [thirdAuxId, setThirdAuxId] = useState("");
    const [anesthetistId, setAnesthetistId] = useState("");
    const [instrumentistId, setInstrumentistId] = useState("");
    const [repasseHospital, setRepasseHospital] = useState(false);
    const [repasseAnesthesia, setRepasseAnesthesia] = useState(false);
    const [repassePathology, setRepassePathology] = useState(false);
    const [repasseDoctor, setRepasseDoctor] = useState(false);
    const [repasseInstrumentist, setRepasseInstrumentist] = useState(false);
    const [repasseMedicalAux, setRepasseMedicalAux] = useState(false);
    const [usesMonitor, setUsesMonitor] = useState(false);
    const [cancerDiagnosis, setCancerDiagnosis] = useState(false);
    const [observations, setObservations] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSurgeryDetailsAction(surgeryId);
            if (!res.success || !res.data) {
                toast.error(typeof res.error === "string" ? res.error : "Erro ao carregar cirurgia");
                return;
            }
            const d = res.data;
            setSurgeryDate(formatDateInput(d.surgeryDate));
            setStatus((d.status as SurgeryStatusValue) ?? "scheduled");
            setProcedureIds(d.procedureLinks?.map((l) => l.procedureId) ?? []);
            setHospitalId(d.hospitalId ?? "");
            setHealthInsuranceId(d.healthInsuranceId ?? "");
            setSurgeonId(d.surgeonId ?? "");
            setFirstAuxId(d.firstAuxId ?? "");
            setSecondAuxId(d.secondAuxId ?? "");
            setThirdAuxId(d.thirdAuxId ?? "");
            setAnesthetistId(d.anesthetistId ?? "");
            setInstrumentistId(d.instrumentistId ?? "");
            setRepasseHospital(!!d.repasseHospital);
            setRepasseAnesthesia(!!d.repasseAnesthesia);
            setRepassePathology(!!d.repassePathology);
            setRepasseDoctor(!!d.repasseDoctor);
            setRepasseInstrumentist(!!d.repasseInstrumentist);
            setRepasseMedicalAux(!!d.repasseMedicalAux);
            setUsesMonitor(!!d.usesMonitor);
            setCancerDiagnosis(!!d.cancerDiagnosis);
            setObservations(d.observations ?? "");
        } finally {
            setLoading(false);
        }
    }, [surgeryId]);

    useEffect(() => {
        if (isOpen && surgeryId) {
            void load();
        }
    }, [isOpen, surgeryId, load]);

    const teamChange = (field: TeamField, value: string) => {
        const setters: Record<TeamField, (v: string) => void> = {
            surgeonId: setSurgeonId,
            firstAuxId: setFirstAuxId,
            secondAuxId: setSecondAuxId,
            thirdAuxId: setThirdAuxId,
            anesthetistId: setAnesthetistId,
            instrumentistId: setInstrumentistId,
        };
        setters[field](value);
    };

    const repasseChange = (field: RepasseField, checked: boolean) => {
        const map: Record<RepasseField, (v: boolean) => void> = {
            repasseHospital: setRepasseHospital,
            repasseAnesthesia: setRepasseAnesthesia,
            repassePathology: setRepassePathology,
            repasseDoctor: setRepasseDoctor,
            repasseInstrumentist: setRepasseInstrumentist,
            repasseMedicalAux: setRepasseMedicalAux,
        };
        map[field](checked);
    };

    const canDeleteSurgery =
        !loading &&
        (canDeleteAsAdmin ||
            (!!currentDoctorId && !!surgeonId && surgeonId === currentDoctorId));

    const focusFormForEdit = useCallback(() => {
        formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        requestAnimationFrame(() => {
            const root = formScrollRef.current;
            if (!root) return;
            const el = root.querySelector<HTMLElement>(
                'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
            );
            el?.focus({ preventScroll: true });
        });
    }, []);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await deleteSurgeryAction(surgeryId, patientId);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Não foi possível excluir");
                return;
            }
            toast.success("Registro de cirurgia excluído.");
            setDeleteOpen(false);
            onSaved();
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveSurgeryAction(patientId, {
                surgeryId,
                patientId,
                surgeryDate: surgeryDate || null,
                status,
                healthInsuranceId: healthInsuranceId || "",
                hospitalId: hospitalId || "",
                procedureIds,
                surgeonId: surgeonId || "",
                firstAuxId: firstAuxId || "",
                secondAuxId: secondAuxId || "",
                thirdAuxId: thirdAuxId || "",
                anesthetistId: anesthetistId || "",
                instrumentistId: instrumentistId || "",
                repasseHospital,
                repasseAnesthesia,
                repassePathology,
                repasseDoctor,
                repasseInstrumentist,
                repasseMedicalAux,
                usesMonitor,
                cancerDiagnosis,
                observations: observations || "",
            });

            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao salvar");
                return;
            }
            toast.success("Cirurgia salva com sucesso!");
            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
        <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col sm:max-w-2xl"
                showCloseButton
            >
                <SheetHeader className="border-b pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:pr-8">
                        <div>
                            <SheetTitle className="text-xl">Dados da cirurgia</SheetTitle>
                            <SheetDescription className="text-sm font-medium text-foreground">
                                Paciente: <span className="font-semibold">{patientName}</span>
                            </SheetDescription>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {!loading ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={focusFormForEdit}
                                    disabled={saving || deleting}
                                >
                                    <Pencil className="size-4" />
                                    Editar
                                </Button>
                            ) : null}
                            {canDeleteSurgery ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteOpen(true)}
                                    disabled={saving || deleting}
                                >
                                    <Trash2 className="size-4" />
                                    Excluir
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </SheetHeader>

                <div ref={formScrollRef} className="flex-1 overflow-y-auto px-1 py-4">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                            <span className="text-sm">Carregando dados...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            <BasicDataSection
                                surgeryDate={surgeryDate}
                                onSurgeryDateChange={setSurgeryDate}
                                status={status}
                                onStatusChange={setStatus}
                                procedures={procedures}
                                procedureIds={procedureIds}
                                onProcedureIdsChange={setProcedureIds}
                            />
                            <LocationAndInsuranceSection
                                hospitals={hospitals}
                                healthInsurances={healthInsurances}
                                hospitalId={hospitalId}
                                onHospitalIdChange={setHospitalId}
                                healthInsuranceId={healthInsuranceId}
                                onHealthInsuranceIdChange={setHealthInsuranceId}
                            />
                            <MedicalTeamSection
                                doctors={doctors}
                                surgeonId={surgeonId}
                                firstAuxId={firstAuxId}
                                secondAuxId={secondAuxId}
                                thirdAuxId={thirdAuxId}
                                anesthetistId={anesthetistId}
                                instrumentistId={instrumentistId}
                                onChange={teamChange}
                            />
                            <FinancialSection
                                repasseHospital={repasseHospital}
                                repasseAnesthesia={repasseAnesthesia}
                                repassePathology={repassePathology}
                                repasseDoctor={repasseDoctor}
                                repasseInstrumentist={repasseInstrumentist}
                                repasseMedicalAux={repasseMedicalAux}
                                onChange={repasseChange}
                            />
                            <AdditionalInfoSection
                                usesMonitor={usesMonitor}
                                cancerDiagnosis={cancerDiagnosis}
                                observations={observations}
                                onUsesMonitorChange={setUsesMonitor}
                                onCancerDiagnosisChange={setCancerDiagnosis}
                                onObservationsChange={setObservations}
                            />
                        </div>
                    )}
                </div>

                <Separator />
                <SheetFooter className="pt-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={() => void handleSave()} disabled={loading || saving}>
                        {saving ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 size-4" />
                        )}
                        Salvar cirurgia
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir registro de cirurgia?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O registro será removido da linha do tempo do paciente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting}
                        onClick={(e) => {
                            e.preventDefault();
                            void handleDelete();
                        }}
                    >
                        {deleting ? "Excluindo…" : "Excluir"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
