"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBoardSchema } from "@/lib/validations/kanban";
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
import { LayoutDashboard } from "lucide-react";
import { createBoardAction } from "@/app/actions/kanban";
import { toast } from "sonner";

const PRESET_ICONS = ["📋", "💼", "💰", "🏥", "📊", "🎯", "📞", "🔧", "📦", "⭐"];
const PRESET_COLORS = [
    "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function CreateBoardModal({ isOpen, onClose, onCreated }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

    const form = useForm({
        resolver: zodResolver(createBoardSchema),
        defaultValues: { name: "", description: "" },
    });

    async function onSubmit(values: any) {
        setIsSubmitting(true);
        try {
            const result = await createBoardAction({
                ...values,
                icon: selectedIcon,
                color: selectedColor,
            });
            if (result.success) {
                toast.success("Quadro criado!");
                form.reset();
                onCreated(result.data);
                onClose();
            } else {
                toast.error(result.error || "Erro ao criar quadro");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <LayoutDashboard className="size-5 text-primary" />
                        Novo Quadro
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Icon selector */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ícone</p>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setSelectedIcon(icon)}
                                        className={`text-xl p-2 rounded-xl transition-all ${selectedIcon === icon
                                                ? "bg-primary/10 ring-2 ring-primary scale-110"
                                                : "bg-muted/30 hover:bg-muted/50"
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color selector */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cor de identificação</p>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setSelectedColor(c)}
                                        className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                                        style={{
                                            backgroundColor: c,
                                            borderColor: selectedColor === c ? "white" : "transparent",
                                            outline: selectedColor === c ? `2px solid ${c}` : "none",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do quadro</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Comercial, Financeiro, RH..."
                                            {...field}
                                            className="rounded-xl"
                                            autoFocus
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
                                    <FormLabel>Descrição (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Para que serve este quadro?"
                                            className="min-h-[70px] rounded-xl resize-none"
                                            {...field}
                                            value={field.value || ""}
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
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-6 shadow-sm shadow-primary/20"
                                style={{ backgroundColor: selectedColor, borderColor: selectedColor }}
                            >
                                {isSubmitting ? "Criando..." : `${selectedIcon} Criar Quadro`}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
