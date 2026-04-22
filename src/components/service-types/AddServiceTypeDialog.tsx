"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createServiceTypeAction } from "@/app/actions/service-types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_TYPE_WORKFLOWS, getServiceTypeWorkflowLabel } from "@/lib/service-type-workflows";
import type { Resolver } from "react-hook-form";
import { serviceTypeSchema, type ServiceTypeInput } from "@/validations/service-types";
import { ServiceTypeTimelineFields } from "./ServiceTypeTimelineFields";

export function AddServiceTypeDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<ServiceTypeInput>({
        resolver: zodResolver(serviceTypeSchema) as Resolver<ServiceTypeInput>,
        defaultValues: {
            name: "",
            description: "",
            workflow: "generic",
            timelineIconKey: undefined,
            timelineColorHex: undefined,
        },
    });

    async function onSubmit(values: ServiceTypeInput) {
        setIsPending(true);
        try {
            const result = await createServiceTypeAction(values);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao cadastrar tipo de atendimento");
                return;
            }

            toast.success("Tipo de atendimento cadastrado com sucesso!");
            form.reset({
                name: "",
                description: "",
                workflow: "generic",
                timelineIconKey: undefined,
                timelineColorHex: undefined,
            });
            setOpen(false);
        } catch {
            toast.error("Erro ao cadastrar tipo de atendimento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Tipo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Novo Tipo de Atendimento</DialogTitle>
                    <DialogDescription>
                        Cadastre um tipo de atendimento para reutilizar em check-ins e atendimentos.
                    </DialogDescription>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Consulta" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="workflow"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fluxo do atendimento</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o fluxo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SERVICE_TYPE_WORKFLOWS.map((workflow) => (
                                                <SelectItem key={workflow.value} value={workflow.value}>
                                                    {getServiceTypeWorkflowLabel(workflow.value)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalhes opcionais para a equipe"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ServiceTypeTimelineFields control={form.control} />

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
