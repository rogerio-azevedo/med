"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, Contact, MapPin, Calendar, Check, Hospital } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import cep from "cep-promise";
import { toast } from "sonner";
import ReactSelect from "react-select";

const customSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "rgba(var(--muted), 0.3)",
        borderColor: state.isFocused ? "rgba(var(--primary), 0.3)" : "rgba(var(--muted-foreground), 0.1)",
        borderRadius: "0.5rem",
        minHeight: "44px",
        boxShadow: "none",
        "&:hover": {
            borderColor: "rgba(var(--primary), 0.3)",
        }
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: "white",
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        padding: "4px",
        zIndex: 50,
    }),
    option: (base: any, state: any) => ({
        ...base,
        borderRadius: "0.5rem",
        backgroundColor: state.isSelected
            ? "hsl(var(--primary))"
            : state.isFocused
                ? "hsl(var(--primary) / 0.1)"
                : "transparent",
        color: state.isSelected ? "white" : "inherit",
        "&:active": {
            backgroundColor: "hsl(var(--primary) / 0.2)",
        }
    }),
    multiValue: (base: any) => ({
        ...base,
        backgroundColor: "hsl(var(--primary) / 0.1)",
        borderRadius: "1rem",
        padding: "2px 8px",
    }),
    multiValueLabel: (base: any) => ({
        ...base,
        color: "hsl(var(--primary))",
        fontWeight: "500",
        fontSize: "12px",
    }),
    multiValueRemove: (base: any) => ({
        ...base,
        color: "hsl(var(--primary))",
        "&:hover": {
            backgroundColor: "hsl(var(--primary) / 0.2)",
            color: "hsl(var(--primary))",
            borderRadius: "1rem",
        }
    })
};

export const patientFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    cpf: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    sex: z.enum(["M", "F", "other"]).optional(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    responsibleDoctorIds: z.array(z.string().uuid()).optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
    defaultValues: PatientFormValues;
    onSubmit: (values: PatientFormValues) => Promise<void>;
    isPending: boolean;
    doctors: { id: string; name: string | null }[];
    onCancel: () => void;
}

export function PatientForm({
    defaultValues,
    onSubmit,
    isPending,
    doctors,
    onCancel,
}: PatientFormProps) {
    const [loadingCEP, setLoadingCEP] = useState(false);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues,
    });

    const zipCode = form.watch("zipCode");

    useEffect(() => {
        const cleanCEP = zipCode?.replace(/\D/g, "");
        if (cleanCEP?.length === 8) {
            setLoadingCEP(true);
            cep(cleanCEP)
                .then((data) => {
                    form.setValue("street", data.street || "");
                    form.setValue("neighborhood", data.neighborhood || "");
                    form.setValue("city", data.city || "");
                    form.setValue("state", data.state || "");
                    toast.success("CEP encontrado!");
                })
                .catch(() => {
                    toast.error("CEP não encontrado");
                })
                .finally(() => {
                    setLoadingCEP(false);
                });
        }
    }, [zipCode, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <ScrollArea className="flex-1 pr-4 -mr-4 h-[60vh] max-h-[60vh]">
                    <div className="space-y-8 p-1 pb-6">
                        {/* Sessão: Dados Pessoais */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                                <Contact className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dados Pessoais</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome completo do paciente" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cpf"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CPF</FormLabel>
                                            <FormControl>
                                                <Input placeholder="000.000.000-00" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(00) 00000-0000" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Email (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@exemplo.com" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="birthDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de Nascimento</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="date" {...field} value={field.value || ""} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all pr-10" />
                                                    <Calendar className="absolute right-3 top-3 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sex"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sexo</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="M">Masculino</SelectItem>
                                                    <SelectItem value="F">Feminino</SelectItem>
                                                    <SelectItem value="other">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Sessão: Vínculo Médico */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                                <Hospital className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vínculo Médico</h4>
                            </div>
                            <FormField
                                control={form.control}
                                name="responsibleDoctorIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Médicos Responsáveis</FormLabel>
                                        <FormControl>
                                            <ReactSelect
                                                isMulti
                                                placeholder="Selecione médicos..."
                                                options={doctors.map(d => ({ value: d.id, label: d.name || "Sem Nome" }))}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={customSelectStyles}
                                                value={doctors
                                                    .filter(d => field.value?.includes(d.id))
                                                    .map(d => ({ value: d.id, label: d.name || "Sem Nome" }))}
                                                onChange={(val) => field.onChange(val.map((v: any) => v.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Sessão: Endereço */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                                <MapPin className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Endereço Residencial</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="zipCode"
                                    render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormLabel>CEP</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input placeholder="00000-000" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                                    {loadingCEP && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Logradouro</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Rua, Avenida..." {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="neighborhood"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Bairro</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Seu Bairro" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Cidade" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>UF</FormLabel>
                                            <FormControl>
                                                <Input placeholder="UF" maxLength={2} {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all uppercase" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex items-center justify-between pt-4 border-t mt-4 flex-shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="hover:bg-muted/50 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" /> Salvar Paciente</>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
