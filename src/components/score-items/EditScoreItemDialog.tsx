"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateScoreItemAction } from "@/app/actions/score-items";
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
import {
    scoreItemSchema,
    type ScoreItemFormInput,
    type ScoreItemInput,
} from "@/lib/validations/score-items";

interface EditScoreItemDialogProps {
    scoreItem: {
        id: string;
        name: string;
        description: string | null;
        score: number;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditScoreItemDialog({
    scoreItem,
    isOpen,
    onOpenChange,
}: EditScoreItemDialogProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<ScoreItemFormInput, unknown, ScoreItemInput>({
        resolver: zodResolver(scoreItemSchema),
        defaultValues: {
            name: scoreItem.name,
            description: scoreItem.description || "",
            score: String(scoreItem.score),
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: scoreItem.name,
                description: scoreItem.description || "",
                score: String(scoreItem.score),
            });
        }
    }, [form, scoreItem, isOpen]);

    async function onSubmit(values: ScoreItemInput) {
        setIsPending(true);
        try {
            const result = await updateScoreItemAction(scoreItem.id, values);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao atualizar pontuação");
                return;
            }

            toast.success("Pontuação atualizada com sucesso!");
            onOpenChange(false);
        } catch {
            toast.error("Erro ao atualizar pontuação");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Editar Pontuação</DialogTitle>
                    <DialogDescription>
                        Atualize os dados da pontuação selecionada.
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
                            name="score"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pontuação</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={1}
                                            {...field}
                                            value={typeof field.value === "string" ? field.value : ""}
                                        />
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
