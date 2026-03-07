"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createCardSchema, updateCardSchema } from "@/lib/validations/kanban";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createCardAction, updateCardAction } from "@/app/actions/kanban";
import { toast } from "sonner";

const FREQUENCIES = [
    { value: "DAILY", label: "Diário" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "BIWEEKLY", label: "Quinzenal" },
    { value: "MONTHLY", label: "Mensal" },
    { value: "BIMONTHLY", label: "Bimestral" },
    { value: "QUARTERLY", label: "Trimestral" },
    { value: "SEMIANNUAL", label: "Semestral" },
    { value: "ANNUAL", label: "Anual" },
];

export function CreateCardModal({ isOpen, onClose, initialColumnId, cardToEdit, categories, clinicUsers, onCreated, onUpdated }: any) {
    const isEditing = !!cardToEdit;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(isEditing ? updateCardSchema : createCardSchema),
        defaultValues: {
            title: "",
            description: "",
            kanbanColumnId: initialColumnId || "",
            priority: "MEDIUM",
            position: 1,
            responsibleId: null,
            categoryId: null,
            startDate: null,
            endDate: null,
            hour: null,
            isRecurringTask: false,
            frequency: null,
        },
    });

    const isRecurring = form.watch("isRecurringTask");

    useEffect(() => {
        if (cardToEdit) {
            // Only pick known schema fields to avoid polluting the form with extra card props
            form.reset({
                title: cardToEdit.title || "",
                description: cardToEdit.description || "",
                kanbanColumnId: cardToEdit.kanbanColumnId,
                priority: cardToEdit.priority || "MEDIUM",
                position: cardToEdit.position ?? 1,
                responsibleId: cardToEdit.responsibleId || null,
                categoryId: cardToEdit.categoryId || null,
                startDate: cardToEdit.startDate ? new Date(cardToEdit.startDate).toISOString() : null,
                endDate: cardToEdit.endDate ? new Date(cardToEdit.endDate).toISOString() : null,
                hour: cardToEdit.hour || null,
                isRecurringTask: cardToEdit.isRecurringTask || false,
                frequency: cardToEdit.frequency || null,
            });
        } else if (initialColumnId) {
            form.reset({
                title: "",
                description: "",
                kanbanColumnId: initialColumnId,
                priority: "MEDIUM",
                position: 1,
                responsibleId: null,
                categoryId: null,
                startDate: null,
                endDate: null,
                hour: null,
                isRecurringTask: false,
                frequency: null,
            });
        }
    }, [cardToEdit, initialColumnId, form]);

    async function onSubmit(values: any) {
        setIsSubmitting(true);
        try {
            if (!values.isRecurringTask) values.frequency = null;

            const result = cardToEdit
                ? await updateCardAction(cardToEdit.id, values)
                : await createCardAction(values);

            if (result.success) {
                toast.success(cardToEdit ? "Tarefa atualizada" : "Tarefa criada");
                // Notify parent so it can update local state optimistically
                if (cardToEdit) {
                    onUpdated?.(result.data);
                } else {
                    onCreated?.(result.data);
                }
                // Background refresh to get full joined data (category, responsible, etc.)
                router.refresh();
                onClose();
            } else {
                toast.error(result.error || "Erro ao salvar tarefa");
            }
        } catch (e: any) {
            toast.error("Erro inesperado");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto rounded-3xl p-6 custom-scrollbar-slim">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {cardToEdit ? "Editar Tarefa" : "Nova Tarefa"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("[CreateCardModal] validation errors:", errors);
                    })} className="space-y-4 pb-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="O que precisa ser feito?" {...field} className="rounded-xl" />
                                    </FormControl>
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
                                            placeholder="Detalhes da tarefa..."
                                            className="min-h-[80px] rounded-xl resize-none"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Nenhuma" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat: any) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="responsibleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsável</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Nenhum" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clinicUsers.map((cu: any) => (
                                                    <SelectItem key={cu.id} value={cu.id}>
                                                        {cu.user?.name || cu.user?.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Início</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                className="rounded-xl"
                                                value={field.value ? field.value.split("T")[0] : ""}
                                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Conclusão</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                className="rounded-xl"
                                                value={field.value ? field.value.split("T")[0] : ""}
                                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="hour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora Máxima (HH:mm)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="time"
                                                className="rounded-xl"
                                                ref={field.ref}
                                                name={field.name}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                                onBlur={field.onBlur}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prioridade</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="LOW">Baixa</SelectItem>
                                                <SelectItem value="MEDIUM">Média</SelectItem>
                                                <SelectItem value="HIGH">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="isRecurringTask"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Tarefa Recorrente</FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                Esta tarefa se repetirá baseada na frequência.
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {isRecurring && (
                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequência da Recorrência</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Selecione a frequência" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FREQUENCIES.map(f => (
                                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 shadow-sm shadow-primary/20">
                                {isSubmitting ? "Salvando..." : (cardToEdit ? "Salvar Alterações" : "Criar Tarefa")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
