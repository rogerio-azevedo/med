"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateHospitalAction } from "@/app/actions/hospitals";
import { hospitalSchema, type HospitalInput } from "@/validations/hospital";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { HospitalFormFields } from "./HospitalFormFields";

interface EditHospitalDialogProps {
    hospital: {
        id: string;
        name: string;
        description: string | null;
        address?: {
            zipCode: string | null;
            street: string | null;
            number: string | null;
            complement: string | null;
            neighborhood: string | null;
            city: string | null;
            state: string | null;
            latitude: number | null;
            longitude: number | null;
        } | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

function toDefaultValues(hospital: EditHospitalDialogProps["hospital"]): HospitalInput {
    return {
        name: hospital.name,
        description: hospital.description || "",
        zipCode: hospital.address?.zipCode || "",
        street: hospital.address?.street || "",
        number: hospital.address?.number || "",
        complement: hospital.address?.complement || "",
        neighborhood: hospital.address?.neighborhood || "",
        city: hospital.address?.city || "",
        state: hospital.address?.state || "",
    };
}

export function EditHospitalDialog({
    hospital,
    isOpen,
    onOpenChange,
}: EditHospitalDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<HospitalInput>({
        resolver: zodResolver(hospitalSchema),
        defaultValues: toDefaultValues(hospital),
    });

    useEffect(() => {
        if (isOpen) {
            form.reset(toDefaultValues(hospital));
        }
    }, [form, hospital, isOpen]);

    async function onSubmit(values: HospitalInput) {
        setIsPending(true);
        try {
            const result = await updateHospitalAction(hospital.id, values);
            const errorMessage =
                "error" in result && typeof result.error === "string"
                    ? result.error
                    : "Erro ao atualizar hospital";

            if (result.success) {
                toast.success("Hospital atualizado com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Erro ao atualizar hospital");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <div className="space-y-1">
                    <DialogTitle>Editar Hospital</DialogTitle>
                    <DialogDescription>
                        Atualize as informações do hospital e o endereço usado no mapa.
                    </DialogDescription>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <HospitalFormFields form={form} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar Alterações
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
