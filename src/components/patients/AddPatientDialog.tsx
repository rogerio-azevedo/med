"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, User } from "lucide-react";
import { createPatientAction } from "@/app/actions/patients";
import { toast } from "sonner";
import { PatientForm, PatientFormValues } from "./PatientForm";

interface AddPatientDialogProps {
    doctors: { id: string; name: string | null }[];
}

export function AddPatientDialog({ doctors }: AddPatientDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

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
    };

    async function onSubmit(values: PatientFormValues) {
        setIsPending(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (key === "responsibleDoctorIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("responsibleDoctorIds", id));
            } else if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value as string);
            }
        });

        try {
            const result = await createPatientAction(formData);
            if (result.success) {
                toast.success("Paciente cadastrado com sucesso!");
                setIsOpen(false);
            } else {
                toast.error(result.error || "Erro ao cadastrar paciente");
            }
        } catch (error) {
            toast.error("Erro ao cadastrar paciente");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                </Button>
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
                        doctors={doctors}
                        onCancel={() => setIsOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
