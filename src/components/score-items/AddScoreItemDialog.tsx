"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createScoreItemAction } from "@/app/actions/score-items";
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
import { Textarea } from "@/components/ui/textarea";
import {
    scoreItemSchema,
    type ScoreItemFormInput,
    type ScoreItemInput,
} from "@/lib/validations/score-items";

export function AddScoreItemDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<ScoreItemFormInput, unknown, ScoreItemInput>({
        resolver: zodResolver(scoreItemSchema),
        defaultValues: {
            name: "",
            description: "",
            score: "0",
        },
    });

    async function onSubmit(values: ScoreItemInput) {
        setIsPending(true);
        try {
            const result = await createScoreItemAction(values);
            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao cadastrar pontuação");
                return;
            }

            toast.success("Pontuação cadastrada com sucesso!");
            form.reset({
                name: "",
                description: "",
                score: "0",
            });
            setOpen(false);
        } catch {
            toast.error("Erro ao cadastrar pontuação");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Pontuação
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <div className="space-y-1">
                    <DialogTitle>Nova Pontuação</DialogTitle>
                    <DialogDescription>
                        Cadastre uma pontuação para reutilizar nas regras e vínculos futuros da clínica.
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
                                        <Input placeholder="Ex: Consulta particular" {...field} />
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
