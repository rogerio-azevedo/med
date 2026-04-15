"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactSelect from "react-select";
import { Loader2, Package, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createProposalSchema, type CreateProposalInput } from "@/lib/validations/proposals";
import { getPaymentMethodLabel } from "@/components/payment-terms/payment-method-options";
import { formatCurrency } from "@/lib/utils";

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

interface PaymentTermOption {
    id: string;
    name: string;
    paymentMethod: string;
    description: string | null;
}

interface ProposalFormProps {
    patients: Patient[];
    products: Product[];
    paymentTerms: PaymentTermOption[];
    onSubmit: (data: CreateProposalInput) => Promise<void>;
    isPending: boolean;
    onCancel: () => void;
    initialData?: Partial<CreateProposalInput>;
    submitLabel?: string;
}

const EMPTY_ITEM = {
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
};

function formatCurrencyInput(valueInCents: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format((valueInCents || 0) / 100);
}

function parseCurrencyInput(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    return digits ? Number(digits) : 0;
}

function toFormValues(initialData?: Partial<CreateProposalInput>): CreateProposalInput {
    return {
        patientId: initialData?.patientId || "",
        validUntil: initialData?.validUntil || "",
        notes: initialData?.notes || "",
        judicialSummary: initialData?.judicialSummary ?? "",
        paymentTermId: initialData?.paymentTermId || "",
        paymentTermLabel: initialData?.paymentTermLabel || "",
        items: initialData?.items?.length
            ? initialData.items.map((item) => ({
                productId: item.productId || "",
                description: item.description || "",
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
            }))
            : [{ ...EMPTY_ITEM }],
    };
}

export function ProposalForm({
    patients,
    products,
    paymentTerms,
    onSubmit,
    isPending,
    onCancel,
    initialData,
    submitLabel = "Salvar Proposta",
}: ProposalFormProps) {
    const defaultFormValues = useMemo(() => toFormValues(initialData), [initialData]);

    const [liminarJudicialEnabled, setLiminarJudicialEnabled] = useState(() =>
        Boolean(initialData?.judicialSummary?.trim())
    );

    const form = useForm<CreateProposalInput>({
        resolver: zodResolver(createProposalSchema),
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        form.reset(defaultFormValues);
    }, [defaultFormValues, form]);

    /** Sincroniza quando o texto salvo no servidor muda (ex.: após refresh). Em criação não há `initialData`. */
    useEffect(() => {
        if (initialData === undefined) return;
        setLiminarJudicialEnabled(Boolean(initialData.judicialSummary?.trim()));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage ao valor persistido, não ao objeto `initialData` a cada render
    }, [initialData?.judicialSummary]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = useWatch({
        control: form.control,
        name: "items",
        defaultValue: defaultFormValues.items,
    });

    const paymentTermLabel = useWatch({
        control: form.control,
        name: "paymentTermLabel",
    });
    const paymentTermId = useWatch({
        control: form.control,
        name: "paymentTermId",
    });

    const totalAmount = useMemo(
        () => watchedItems.reduce((acc, item) => acc + (Number(item?.totalPrice) || 0), 0),
        [watchedItems]
    );

    const productMap = useMemo(
        () => new Map(products.map((product) => [product.id, product])),
        [products]
    );

    const patientOptions = useMemo(
        () => patients.map((patient) => ({ value: patient.id, label: patient.name })),
        [patients]
    );

    const productOptions = useMemo(
        () => products.map((product) => ({ value: product.id, label: product.name })),
        [products]
    );
    const selectedPaymentTerm = useMemo(
        () => paymentTerms.find((term) => term.id === paymentTermId),
        [paymentTermId, paymentTerms]
    );

    function setPaymentTermSnapshot(paymentTermId: string) {
        const selected = paymentTerms.find((term) => term.id === paymentTermId);
        form.setValue("paymentTermId", paymentTermId, { shouldValidate: true });
        form.setValue("paymentTermLabel", selected?.name || "", { shouldValidate: false });
    }

    function handleProductChange(index: number, productId: string) {
        const product = productMap.get(productId);
        const quantity = form.getValues(`items.${index}.quantity`) || 1;
        const unitPrice = product?.sellingPrice || 0;
        const totalPrice = unitPrice * quantity;

        form.setValue(`items.${index}.productId`, productId, { shouldValidate: true });
        form.setValue(`items.${index}.description`, product?.name || "", { shouldValidate: false });
        form.setValue(`items.${index}.unitPrice`, unitPrice, { shouldValidate: true });
        form.setValue(`items.${index}.totalPrice`, totalPrice, { shouldValidate: true });
    }

    function handleQuantityChange(index: number, quantity: number) {
        const normalizedQuantity = Math.max(1, quantity || 1);
        const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;

        form.setValue(`items.${index}.quantity`, normalizedQuantity, { shouldValidate: true });
        form.setValue(`items.${index}.totalPrice`, unitPrice * normalizedQuantity, { shouldValidate: true });
    }

    function handleUnitPriceChange(index: number, rawValue: string) {
        const unitPrice = Math.max(0, parseCurrencyInput(rawValue));
        const quantity = form.getValues(`items.${index}.quantity`) || 1;

        form.setValue(`items.${index}.unitPrice`, unitPrice, { shouldValidate: true });
        form.setValue(`items.${index}.totalPrice`, unitPrice * quantity, { shouldValidate: true });
    }

    function handleTotalPriceChange(index: number, rawValue: string) {
        const totalPrice = Math.max(0, parseCurrencyInput(rawValue));
        const quantity = Math.max(1, form.getValues(`items.${index}.quantity`) || 1);
        const unitPrice = Math.round(totalPrice / quantity);

        form.setValue(`items.${index}.totalPrice`, totalPrice, { shouldValidate: true });
        form.setValue(`items.${index}.unitPrice`, unitPrice, { shouldValidate: true });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="patientId"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="paymentTermId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Forma de Pagamento</FormLabel>
                                <Select
                                    value={field.value || "none"}
                                    onValueChange={(value) => setPaymentTermSnapshot(value === "none" ? "" : value)}
                                    disabled={isPending}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma condição" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Sem condição definida</SelectItem>
                                        {paymentTerms.map((term) => (
                                            <SelectItem key={term.id} value={term.id}>
                                                {term.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="rounded-xl border bg-muted/20 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Condição selecionada
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                            {paymentTermLabel || "Nenhuma condição selecionada"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {selectedPaymentTerm?.paymentMethod
                                ? `Modalidade: ${getPaymentMethodLabel(selectedPaymentTerm.paymentMethod)}`
                                : "Selecione uma condição para definir a modalidade."}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <Package className="h-5 w-5 text-primary" />
                            Itens do Orçamento
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ ...EMPTY_ITEM })}
                            disabled={isPending}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Adicionar Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid grid-cols-12 items-end gap-3 rounded-xl border bg-muted/30 p-4"
                            >
                                <div className="col-span-12 md:col-span-4">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                                    Produto / Plano
                                                </FormLabel>
                                                <FormControl>
                                                    <ReactSelect
                                                        options={productOptions}
                                                        value={productOptions.find((option) => option.value === field.value)}
                                                        onChange={(option) => handleProductChange(index, option?.value || "")}
                                                        placeholder="Selecione..."
                                                        isDisabled={isPending}
                                                        isSearchable
                                                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                                        styles={{
                                                            menuPortal: (base) => ({
                                                                ...base,
                                                                zIndex: 9999,
                                                                pointerEvents: "auto",
                                                            }),
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

                                <div className="col-span-6 md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                                    Qtd
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={(event) =>
                                                            handleQuantityChange(index, parseInt(event.target.value, 10) || 1)
                                                        }
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-6 md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.unitPrice`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                                    Valor Unitário
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formatCurrencyInput(field.value || 0)}
                                                        onChange={(event) => handleUnitPriceChange(index, event.target.value)}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-10 md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.totalPrice`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                                    Total do Item
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formatCurrencyInput(field.value || 0)}
                                                        onChange={(event) => handleTotalPriceChange(index, event.target.value)}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-2 md:col-span-1 flex justify-end">
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

                                <div className="col-span-12 rounded-lg bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                                    {watchedItems?.[index]?.productId
                                        ? `Resumo do item: ${formatCurrency(watchedItems[index]?.unitPrice || 0)} x ${watchedItems[index]?.quantity || 1
                                        } = ${formatCurrency(watchedItems[index]?.totalPrice || 0)}`
                                        : "Selecione um produto para iniciar o item."}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="liminar-judicial" className="text-base">
                                Atendimento por Liminar Judicial
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Ative para registrar resumo do caso e justificativa; o conteúdo aparece no PDF do orçamento.
                            </p>
                        </div>
                        <Switch
                            id="liminar-judicial"
                            checked={liminarJudicialEnabled}
                            onCheckedChange={(checked) => {
                                setLiminarJudicialEnabled(checked);
                                if (!checked) {
                                    form.setValue("judicialSummary", "", {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }
                            }}
                            disabled={isPending}
                            className="shrink-0"
                        />
                    </div>
                    {liminarJudicialEnabled ? (
                        <FormField
                            control={form.control}
                            name="judicialSummary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resumo do caso e justificativa judicial</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva o contexto judicial, o que foi determinado na liminar e a justificativa dos procedimentos solicitados..."
                                            className="min-h-[160px] resize-y text-sm"
                                            {...field}
                                            value={field.value ?? ""}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : null}
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

                <div className="flex items-center justify-between border-t pt-6">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium uppercase text-muted-foreground">Valor Total</span>
                        <span className="text-3xl font-black text-primary">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" size="lg" disabled={isPending} className="px-8 shadow-lg shadow-primary/20">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
