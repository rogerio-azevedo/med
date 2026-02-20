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
import { Tag, Loader2, Check } from "lucide-react";
import { updateSpecialtyAction } from "@/app/actions/specialties";
import { toast } from "sonner";

const specialtyFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().optional(),
});

type SpecialtyFormValues = z.infer<typeof specialtyFormSchema>;

interface EditSpecialtyDialogProps {
    specialty: {
        id: string;
        name: string;
        code: string | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditSpecialtyDialog({ specialty, isOpen, onOpenChange }: EditSpecialtyDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<SpecialtyFormValues>({
        resolver: zodResolver(specialtyFormSchema),
        defaultValues: {
            name: specialty.name,
            code: specialty.code || "",
        },
    });

    async function onSubmit(values: SpecialtyFormValues) {
        setIsPending(true);
        try {
            const result = await updateSpecialtyAction(specialty.id, values);
            if (result.success) {
                toast.success("Especialidade atualizada com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao atualizar especialidade");
            }
        } catch (error) {
            toast.error("Erro ao atualizar especialidade");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <Tag size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Editar Especialidade</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Atualize as informações da especialidade.
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
                        onClick={() => onOpenChange(false)}
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
                            <><Check className="mr-2 h-4 w-4" /> Salvar Alterações</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
