"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateHealthInsuranceAction } from "@/app/actions/health-insurances";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().optional(),
    ansCode: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditHealthInsuranceDialogProps {
    healthInsurance: {
        id: string;
        name: string;
        code: string | null;
        ansCode: string | null;
        notes: string | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditHealthInsuranceDialog({
    healthInsurance,
    isOpen,
    onOpenChange,
}: EditHealthInsuranceDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: healthInsurance.name,
            code: healthInsurance.code || "",
            ansCode: healthInsurance.ansCode || "",
            notes: healthInsurance.notes || "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: healthInsurance.name,
                code: healthInsurance.code || "",
                ansCode: healthInsurance.ansCode || "",
                notes: healthInsurance.notes || "",
            });
        }
    }, [form, healthInsurance, isOpen]);

    async function onSubmit(values: FormValues) {
        setIsPending(true);
        try {
            const result = await updateHealthInsuranceAction(healthInsurance.id, values);
            if (result.success) {
                toast.success("Convênio atualizado com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao atualizar convênio");
            }
        } catch {
            toast.error("Erro ao atualizar convênio");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Editar Convênio</DialogTitle>
                    <DialogDescription>
                        Atualize os dados do convênio selecionado.
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ansCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código ANS</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
