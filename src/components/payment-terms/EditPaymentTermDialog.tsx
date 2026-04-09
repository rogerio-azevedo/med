"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePaymentTermAction } from "@/app/actions/payment-terms";
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
import { paymentTermSchema, type PaymentTermInput } from "@/lib/validations/payment-terms";
import { paymentMethodOptions } from "./payment-method-options";

interface EditPaymentTermDialogProps {
    paymentTerm: {
        id: string;
        name: string;
        paymentMethod: PaymentTermInput["paymentMethod"];
        description: string | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditPaymentTermDialog({
    paymentTerm,
    isOpen,
    onOpenChange,
}: EditPaymentTermDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<PaymentTermInput>({
        resolver: zodResolver(paymentTermSchema),
        defaultValues: {
            name: paymentTerm.name,
            paymentMethod: paymentTerm.paymentMethod,
            description: paymentTerm.description || "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: paymentTerm.name,
                paymentMethod: paymentTerm.paymentMethod,
                description: paymentTerm.description || "",
            });
        }
    }, [form, paymentTerm, isOpen]);

    async function onSubmit(values: PaymentTermInput) {
        setIsPending(true);
        try {
            const result = await updatePaymentTermAction(paymentTerm.id, values);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao atualizar condição de pagamento");
                return;
            }

            toast.success("Condição de pagamento atualizada com sucesso!");
            onOpenChange(false);
        } catch {
            toast.error("Erro ao atualizar condição de pagamento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Editar Condição de Pagamento</DialogTitle>
                    <DialogDescription>
                        Atualize os dados da condição de pagamento selecionada.
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
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modalidade</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a modalidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {paymentMethodOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
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
