"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createProductSchema, CreateProductInput } from "@/lib/validations/products";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface PackageFormProps {
    initialData?: Partial<CreateProductInput> & { id?: string };
    onSubmit: (data: CreateProductInput) => Promise<void>;
    isPending: boolean;
    onCancel: () => void;
}

export function PackageForm({
    initialData,
    onSubmit,
    isPending,
    onCancel,
}: PackageFormProps) {
    const form = useForm<CreateProductInput>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            type: initialData?.type || "plan_package",
            name: initialData?.name || "",
            description: initialData?.description || "",
            costPrice: initialData?.costPrice || 0,
            sellingPrice: initialData?.sellingPrice || 0,
            isActive: initialData?.isActive ?? true,
        } as CreateProductInput,
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                type: initialData.type || "plan_package",
                name: initialData.name || "",
                description: initialData.description || "",
                costPrice: initialData.costPrice || 0,
                sellingPrice: initialData.sellingPrice || 0,
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Produto</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isPending}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="plan_package">Plano/Pacote</SelectItem>
                                        <SelectItem value="surgery">Cirurgia</SelectItem>
                                        <SelectItem value="exam">Exame</SelectItem>
                                        <SelectItem value="consultation">Consulta</SelectItem>
                                        <SelectItem value="other">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Plano Anual Premium" {...field} disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descreva o que está incluso..."
                                    className="min-h-[100px]"
                                    {...field}
                                    value={field.value ?? ""}
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Custo (R$)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        {...field}
                                        value={field.value / 100}
                                        onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || "0") * 100))}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço de Venda (R$)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        {...field}
                                        value={field.value / 100}
                                        onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || "0") * 100))}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData?.id ? "Salvar Alterações" : "Criar Produto"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
