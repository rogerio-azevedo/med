"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createHospitalAction } from "@/app/actions/hospitals";
import { hospitalSchema, type HospitalInput } from "@/lib/validations/hospital";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { HospitalFormFields } from "./HospitalFormFields";

const defaultValues: HospitalInput = {
    name: "",
    description: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
};

export function AddHospitalDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<HospitalInput>({
        resolver: zodResolver(hospitalSchema),
        defaultValues,
    });

    async function onSubmit(values: HospitalInput) {
        setIsPending(true);
        try {
            const result = await createHospitalAction(values);
            const errorMessage =
                "error" in result && typeof result.error === "string"
                    ? result.error
                    : "Erro ao cadastrar hospital";

            if (result.success) {
                toast.success("Hospital cadastrado com sucesso!");
                form.reset(defaultValues);
                setOpen(false);
            } else {
                toast.error(errorMessage);
            }
        } catch {
            toast.error("Erro ao cadastrar hospital");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Hospital
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <div className="space-y-1">
                    <DialogTitle>Novo Hospital</DialogTitle>
                    <DialogDescription>
                        Cadastre hospitais vinculados a esta clínica e use o endereço para exibição no mapa.
                    </DialogDescription>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <HospitalFormFields form={form} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
