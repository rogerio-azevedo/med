"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import ReactSelect from "react-select";
import { createProposalSchema, CreateProposalInput } from "@/lib/validations/proposals";
import { Loader2, Plus, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useMemo } from "react";

interface Product {
    id: string;
    name: string;
    sellingPrice: number;
    type: string;
}

interface Patient {
    id: string;
    name: string;
}

interface ProposalFormProps {
    patients: Patient[];
    products: Product[];
    onSubmit: (data: CreateProposalInput) => Promise<void>;
    isPending: boolean;
    onCancel: () => void;
}

export function ProposalForm({
    patients,
    products,
    onSubmit,
    isPending,
    onCancel,
}: ProposalFormProps) {
    const form = useForm<CreateProposalInput>({
        resolver: zodResolver(createProposalSchema),
        defaultValues: {
            patientId: "",
            notes: "",
            items: [{ productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = useWatch({
        control: form.control,
        name: "items",
    });
    
    const itemsForTotal = watchedItems || [];

    const totalAmount = useMemo(() => {
        return itemsForTotal.reduce((acc, item) => acc + (Number(item?.totalPrice) || 0), 0);
    }, [itemsForTotal]);

    const handleProductChange = (index: number, productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
            const quantity = form.getValues(`items.${index}.quantity`) || 1;
            const unitPrice = product.sellingPrice;
            const totalPrice = unitPrice * quantity;
            
            form.setValue(`items.${index}.unitPrice`, unitPrice);
            form.setValue(`items.${index}.totalPrice`, totalPrice, { shouldValidate: true });
            form.setValue(`items.${index}.description`, product.name);
        }
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;
        form.setValue(`items.${index}.totalPrice`, unitPrice * quantity, { shouldValidate: true });
    };

    const patientOptions = useMemo(() => 
        patients.map((p) => ({ value: p.id, label: p.name })),
    [patients]);

    const productOptions = useMemo(() => 
        products.map((p) => ({ value: p.id, label: p.name })),
    [products]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                        control={form.control}
                        name="patientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Paciente (Cliente)</FormLabel>
                                <FormControl>
                                    <ReactSelect
                                        options={patientOptions}
                                        value={patientOptions.find((option) => option.value === field.value)}
                                        onChange={(option) => field.onChange(option?.value)}
                                        placeholder="Selecione o paciente..."
                                        isDisabled={isPending}
                                        isSearchable
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999, pointerEvents: "auto" }),
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.5rem",
                                                borderColor: "hsl(var(--input))",
                                                backgroundColor: "transparent",
                                                minHeight: "40px",
                                            }),
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Validade da Proposta</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Itens do Orçamento
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 })}
                            disabled={isPending}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-xl bg-muted/30">
                                <div className="col-span-12 md:col-span-5">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Produto / Plano</FormLabel>
                                                <FormControl>
                                                    <ReactSelect
                                                        options={productOptions}
                                                        value={productOptions.find((option) => option.value === field.value)}
                                                        onChange={(option) => {
                                                            field.onChange(option?.value);
                                                            if (option) handleProductChange(index, option.value);
                                                        }}
                                                        placeholder="Selecione..."
                                                        isDisabled={isPending}
                                                        isSearchable
                                                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                                        styles={{
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999, pointerEvents: "auto" }),
                                                            control: (base) => ({
                                                                ...base,
                                                                borderRadius: "0.5rem",
                                                                borderColor: "hsl(var(--input))",
                                                                backgroundColor: "transparent",
                                                                minHeight: "40px",
                                                            }),
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Qtd</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        min="1" 
                                                        {...field} 
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            field.onChange(val);
                                                            handleQuantityChange(index, val);
                                                        }}
                                                        disabled={isPending} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-4">
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Total do Item</FormLabel>
                                        <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 font-semibold text-primary">
                                            {formatCurrency(itemsForTotal[index]?.totalPrice || 0)}
                                        </div>
                                    </FormItem>
                                </div>

                                <div className="col-span-12 md:col-span-1 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => remove(index)}
                                        disabled={isPending || fields.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações do Orçamento</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Ex: Condição especial para pagamento à vista..." 
                                    className="min-h-[80px]"
                                    {...field} 
                                    value={field.value ?? ""}
                                    disabled={isPending} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium uppercase">Valor Total</span>
                        <span className="text-3xl font-black text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" size="lg" disabled={isPending} className="px-8 shadow-lg shadow-primary/20">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Gerar Proposta
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
