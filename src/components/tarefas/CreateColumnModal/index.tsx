"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Columns3, Lock } from "lucide-react";
import { createColumnAction } from "@/app/actions/kanban";
import { toast } from "sonner";

const schema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100),
});

export function CreateColumnModal({ isOpen, onClose, boardId, currentCount, onCreated }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "" },
    });

    async function onSubmit(values: any) {
        setIsSubmitting(true);
        try {
            const result = await createColumnAction({
                boardId,
                name: values.name,
                // Position before the last (DONE) column
                position: currentCount - 1,
                columnType: "IN_PROGRESS",
            });
            if (result.success) {
                toast.success("Coluna criada!");
                form.reset();
                onCreated(result.data);
                onClose();
            } else {
                toast.error(result.error || "Erro ao criar coluna");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[380px] rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Columns3 className="size-5 text-primary" />
                        Nova Coluna
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-2xl text-xs text-amber-700 dark:text-amber-400">
                    <Lock className="size-3.5 mt-0.5 shrink-0" />
                    <span>A nova coluna será criada como <strong>Em Andamento</strong>, inserida antes da coluna final &quot;Concluído&quot; (que é fixa).</span>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da coluna</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Em Revisão, Aguardando Aprovação..."
                                            {...field}
                                            className="rounded-xl"
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl px-6 shadow-sm shadow-primary/20">
                                {isSubmitting ? "Criando..." : "Criar coluna"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
