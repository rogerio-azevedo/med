"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { updatePatientAction, getPatientAction } from "@/app/actions/patients";
import { toast } from "sonner";
import { PatientForm, PatientFormValues } from "./PatientForm";

type SelectedDoctorRef = { id: string; name: string | null };
type DoctorOption = { id: string; name: string | null; relationshipType: "linked" | "partner" };

interface PatientForEdit {
    id?: string;
    name?: string | null;
    cpf?: string | null;
    email?: string | null;
    phone?: string | null;
    birthDate?: string | Date | null;
    sex?: string | null;
    address?: {
        zipCode?: string | null;
        street?: string | null;
        number?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
    } | null;
    responsibleDoctors?: SelectedDoctorRef[];
    patientHealthInsurances?: PatientFormValues["patientHealthInsurances"];
    originType?: PatientFormValues["originType"] | null;
    referringDoctorId?: string | null;
}

interface EditPatientDialogProps {
    patientId: string;
    doctors: DoctorOption[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: PatientForEdit | null;
}

export function EditPatientDialog({
    patientId,
    doctors,
    isOpen,
    onOpenChange,
    initialData,
}: EditPatientDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [patient, setPatient] = useState<PatientForEdit | null>(initialData ?? null);

    // If no initialData, we should fetch it. 
    // For simplicity in this edit, let's assume we'll pass enough data or fetch it here.
    // I created getPatientById query, let's create an action to call it.

    useEffect(() => {
        if (isOpen && !initialData && patientId) {
            const fetchPatient = async () => {
                setIsLoading(true);
                try {
                    const result = await getPatientAction(patientId);
                    if (result.success && result.patient) {
                        setPatient(result.patient as PatientForEdit);
                    } else {
                        toast.error(result.error || "Erro ao carregar dados do paciente");
                    }
                } catch {
                    toast.error("Erro ao carregar dados do paciente");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPatient();
        } else if (initialData) {
            setPatient(initialData);
        }

        // Cleanup when closing
        if (!isOpen) {
            setTimeout(() => setPatient(null), 300); // clear after animation
        }
    }, [isOpen, patientId, initialData]);

    const defaultValues: PatientFormValues = patient ? {
        name: patient.name || "",
        email: patient.email || "",
        cpf: patient.cpf || "",
        phone: patient.phone || "",
        birthDate: patient.birthDate ? (typeof patient.birthDate === "string" ? patient.birthDate : new Date(patient.birthDate).toISOString().split("T")[0]) : "",
        sex: (patient.sex as "M" | "F" | "other") || "M",
        zipCode: patient.address?.zipCode || "",
        street: patient.address?.street || "",
        number: patient.address?.number || "",
        neighborhood: patient.address?.neighborhood || "",
        city: patient.address?.city || "",
        state: patient.address?.state || "",
        responsibleDoctorIds: patient.responsibleDoctors?.map((d: SelectedDoctorRef) => d.id) ?? [],
        patientHealthInsurances: patient.patientHealthInsurances ?? [],
        originType: patient.originType ?? undefined,
        referringDoctorId: patient.referringDoctorId ?? undefined,
    } : {
        name: "",
        email: "",
        cpf: "",
        phone: "",
        birthDate: "",
        sex: "M",
        zipCode: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        responsibleDoctorIds: [],
        patientHealthInsurances: [],
    };

    async function onSubmit(values: PatientFormValues) {
        setIsPending(true);
        const formData = new FormData();
        const appendScalar = (key: string, value: string | undefined) => {
            if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value);
            }
        };

        appendScalar("name", values.name);
        appendScalar("email", values.email);
        appendScalar("cpf", values.cpf);
        appendScalar("phone", values.phone);
        appendScalar("birthDate", values.birthDate);
        appendScalar("sex", values.sex);
        appendScalar("zipCode", values.zipCode);
        appendScalar("street", values.street);
        appendScalar("number", values.number);
        appendScalar("complement", values.complement);
        appendScalar("neighborhood", values.neighborhood);
        appendScalar("city", values.city);
        appendScalar("state", values.state);
        appendScalar("originType", values.originType);
        appendScalar("referringDoctorId", values.referringDoctorId);

        values.responsibleDoctorIds?.forEach((id) => formData.append("responsibleDoctorIds", id));
        formData.append("patientHealthInsurances", JSON.stringify(values.patientHealthInsurances ?? []));

        try {
            const result = await updatePatientAction(patientId, formData);
            if (result.success) {
                toast.success("Paciente atualizado com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao atualizar paciente");
            }
        } catch {
            toast.error("Erro ao atualizar paciente");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <Pencil size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Editar Paciente</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Atualize as informações do paciente e o médico responsável.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {isLoading || (!patient && !initialData) ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground font-medium">Carregando dados...</p>
                        </div>
                    ) : (
                        <PatientForm
                            key={patient?.id || "form"}
                            defaultValues={defaultValues}
                            onSubmit={(values) => onSubmit(values)}
                            isPending={isPending}
                            doctors={doctors}
                            onCancel={() => onOpenChange(false)}
                            mode="edit"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
