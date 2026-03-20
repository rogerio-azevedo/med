"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, User } from "lucide-react";
import { createPatientAction } from "@/app/actions/patients";
import { toast } from "sonner";
import { PatientForm, PatientFormValues } from "./PatientForm";

interface AddPatientDialogProps {
    doctors: { id: string; name: string | null; relationshipType: "linked" | "partner" | null }[];
    children?: React.ReactNode;
    onSuccess?: (patientId: string) => void;
}

export function AddPatientDialog({ doctors, children, onSuccess }: AddPatientDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const defaultValues: PatientFormValues = {
        name: "",
        email: "",
        cpf: "",
        phone: "",
        birthDate: "",
        sex: "M" as const,
        zipCode: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        responsibleDoctorIds: [],
        originType: undefined,
        referringDoctorId: undefined,
        patientHealthInsurances: [],
    };

    async function onSubmit(values: PatientFormValues, intent: "create" | "reactivate" | "import", globalId?: string) {
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

        formData.append("intent", intent);
        if (globalId) formData.append("globalId", globalId);

        try {
            const result = await createPatientAction(formData);
            if (result.success) {
                toast.success("Paciente cadastrado/atualizado com sucesso!");
                setIsOpen(false);
                if (result.patientId && onSuccess) {
                    onSuccess(result.patientId);
                }
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao processar requisição do paciente");
            }
        } catch {
            toast.error("Erro interno. Tente novamente.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Paciente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <User size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Novo Paciente</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Cadastro manual para pacientes que necessitam de auxílio.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <PatientForm
                        defaultValues={defaultValues}
                        onSubmit={onSubmit}
                        isPending={isPending}
                        doctors={doctors as { id: string; name: string | null; relationshipType: "linked" | "partner" }[]}
                        onCancel={() => setIsOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
