"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus, Loader2, Tag, Check, ShieldCheck } from "lucide-react";
import { createSpecialtyAction } from "@/app/actions/specialties";
import { toast } from "sonner";

const specialtyFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().optional(),
});

type SpecialtyFormValues = z.infer<typeof specialtyFormSchema>;

export function AddSpecialtyDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<SpecialtyFormValues>({
        resolver: zodResolver(specialtyFormSchema),
        defaultValues: {
            name: "",
            code: "",
        },
    });

    async function onSubmit(values: SpecialtyFormValues) {
        setIsPending(true);
        try {
            const result = await createSpecialtyAction(values);
            if (result.success) {
                toast.success("Especialidade cadastrada com sucesso!");
                setIsOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Erro ao cadastrar especialidade");
            }
        } catch (error) {
            toast.error("Erro ao cadastrar especialidade");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Especialidade
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <Tag size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Nova Especialidade</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Cadastre uma nova especialidade médica no sistema.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Especialidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Cardiologia" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: CARD-01" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </form>
                </Form>

                <DialogFooter className="p-6 bg-muted/20 border-t flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="hover:bg-muted/50 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        onClick={form.handleSubmit(onSubmit)}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95 text-white"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" /> Cadastrar</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
