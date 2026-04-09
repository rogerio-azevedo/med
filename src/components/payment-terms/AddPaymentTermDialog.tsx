"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPaymentTermAction } from "@/app/actions/payment-terms";
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
import { paymentTermSchema, type PaymentTermInput } from "@/lib/validations/payment-terms";
import { paymentMethodOptions } from "./payment-method-options";

export function AddPaymentTermDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<PaymentTermInput>({
        resolver: zodResolver(paymentTermSchema),
        defaultValues: {
            name: "",
            paymentMethod: "pix",
            description: "",
        },
    });

    async function onSubmit(values: PaymentTermInput) {
        setIsPending(true);
        try {
            const result = await createPaymentTermAction(values);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao cadastrar condição de pagamento");
                return;
            }

            toast.success("Condição de pagamento cadastrada com sucesso!");
            form.reset();
            setOpen(false);
        } catch {
            toast.error("Erro ao cadastrar condição de pagamento");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Condição
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Nova Condição de Pagamento</DialogTitle>
                    <DialogDescription>
                        Cadastre uma forma de pagamento para reutilizar nas propostas da clínica.
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
                                        <Input placeholder="Ex: 50% entrada + 50% em 30 dias" {...field} />
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
                                        <Textarea
                                            placeholder="Detalhes adicionais opcionais para a equipe"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
