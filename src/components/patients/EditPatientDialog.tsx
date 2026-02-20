"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, User, Loader2 } from "lucide-react";
import { updatePatientAction, getPatientAction } from "@/app/actions/patients";
import { toast } from "sonner";
import { PatientForm, PatientFormValues } from "./PatientForm";

interface EditPatientDialogProps {
    patientId: string;
    doctors: { id: string; name: string | null }[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    // We'll use a server action to get the data or pass it if easy
    // For now, let's assume we might need to fetch it or pass it.
    // Given the context, let's try to fetch it via a client-side action or prop.
    initialData?: any;
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
    const [patient, setPatient] = useState<any>(initialData || null);

    // If no initialData, we should fetch it. 
    // For simplicity in this edit, let's assume we'll pass enough data or fetch it here.
    // I created getPatientById query, let's create an action to call it.

    useEffect(() => {
        if (isOpen && !initialData && patientId) {
            const fetchPatient = async () => {
                setIsLoading(true);
                try {
                    const result = await getPatientAction(patientId);
                    if (result.success) {
                        setPatient(result.patient);
                    } else {
                        toast.error(result.error || "Erro ao carregar dados do paciente");
                    }
                } catch (error) {
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
        birthDate: patient.birthDate || "",
        sex: (patient.sex as "M" | "F" | "other") || "M",
        zipCode: patient.address?.zipCode || "",
        street: patient.address?.street || "",
        number: patient.address?.number || "",
        neighborhood: patient.address?.neighborhood || "",
        city: patient.address?.city || "",
        state: patient.address?.state || "",
        responsibleDoctorIds: patient.responsibleDoctors?.map((d: any) => d.id) || [],
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
    };

    async function onSubmit(values: PatientFormValues) {
        setIsPending(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (key === "responsibleDoctorIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("responsibleDoctorIds", id));
            } else if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value as string);
            } else if (value === null) {
                formData.append(key, "null");
            }
        });

        try {
            const result = await updatePatientAction(patientId, formData);
            if (result.success) {
                toast.success("Paciente atualizado com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao atualizar paciente");
            }
        } catch (error) {
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
                            onSubmit={onSubmit}
                            isPending={isPending}
                            doctors={doctors}
                            onCancel={() => onOpenChange(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
