"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateServiceTypeAction } from "@/app/actions/service-types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
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
import { parseServiceTypeTimelineIconKey } from "@/lib/service-type-timeline-icons";
import { ServiceTypeTimelineFields } from "./ServiceTypeTimelineFields";

interface EditServiceTypeDialogProps {
    serviceType: {
        id: string;
        name: string;
        description: string | null;
        workflow: string;
        timelineIconKey: string | null;
        timelineColorHex: string | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditServiceTypeDialog({
    serviceType,
    isOpen,
    onOpenChange,
}: EditServiceTypeDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<ServiceTypeInput>({
        resolver: zodResolver(serviceTypeSchema) as Resolver<ServiceTypeInput>,
        defaultValues: {
            name: serviceType.name,
            description: serviceType.description || "",
            workflow: serviceType.workflow as ServiceTypeInput["workflow"],
            timelineIconKey: parseServiceTypeTimelineIconKey(serviceType.timelineIconKey),
            timelineColorHex: serviceType.timelineColorHex ?? undefined,
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: serviceType.name,
                description: serviceType.description || "",
                workflow: serviceType.workflow as ServiceTypeInput["workflow"],
                timelineIconKey: parseServiceTypeTimelineIconKey(serviceType.timelineIconKey),
                timelineColorHex: serviceType.timelineColorHex ?? undefined,
            });
        }
    }, [form, serviceType, isOpen]);

    async function onSubmit(values: ServiceTypeInput) {
        setIsPending(true);
        try {
            const result = await updateServiceTypeAction(serviceType.id, values);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao atualizar tipo de atendimento");
                return;
            }

            toast.success("Tipo de atendimento atualizado com sucesso!");
            onOpenChange(false);
        } catch {
            toast.error("Erro ao atualizar tipo de atendimento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Editar Tipo de Atendimento</DialogTitle>
                    <DialogDescription>
                        Atualize os dados do tipo de atendimento selecionado.
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
                                        <Input {...field} />
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
                                        <Textarea {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ServiceTypeTimelineFields control={form.control} />

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
