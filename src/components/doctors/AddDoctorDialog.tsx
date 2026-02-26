"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Stethoscope, Loader2, Mail, Lock, ShieldCheck, Check, ArrowRight, UserPlus, Info } from "lucide-react";
import { createDoctorAction } from "@/app/actions/doctors";
import { getSpecialtiesAction } from "@/app/actions/specialties";
import { getPracticeAreasAction } from "@/app/actions/practice-areas";
import { checkDoctorEligibilityAction } from "@/app/actions/doctors/eligibility";
import { toast } from "sonner";
import ReactSelect from "react-select";
import cep from "cep-promise";
import { maskPhone } from "@/utils/masks";
import { BRAZILIAN_STATES } from "@/utils/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SimpleMap = dynamic(
    () => import("@/components/maps/SimpleMap").then((m) => m.SimpleMap),
    { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted rounded-xl min-h-[260px]" /> }
);

const doctorFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    phone: z.string().optional(),
    specialtyIds: z.array(z.string()).optional(),
    practiceAreaIds: z.array(z.string()).optional(),
    addressZipCode: z.string().optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressLatitude: z.number().optional(),
    addressLongitude: z.number().optional(),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

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
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
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

export function AddDoctorDialog({ customTrigger }: { customTrigger?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [practiceAreas, setPracticeAreas] = useState<{ value: string; label: string }[]>([]);

    const [step, setStep] = useState<"crm" | "details">("crm");
    const [checkingCrm, setCheckingCrm] = useState(false);
    const [doctorIntent, setDoctorIntent] = useState<"create" | "reactivate" | "import">("create");
    const [existingDoctorId, setExistingDoctorId] = useState<string | undefined>();
    const [infoMessage, setInfoMessage] = useState<{ title: string; desc: string } | null>(null);

    const form = useForm<DoctorFormValues>({
        resolver: zodResolver(doctorFormSchema),
        defaultValues: {
            name: "", email: "", password: "", crm: "", crmState: "", phone: "",
            specialtyIds: [], practiceAreaIds: [],
            addressZipCode: "", addressStreet: "", addressNumber: "",
            addressComplement: "", addressNeighborhood: "", addressCity: "", addressState: "",
        },
    });

    const addressLatitude = form.watch("addressLatitude");
    const addressLongitude = form.watch("addressLongitude");

    useEffect(() => {
        if (!isOpen) {
            setStep("crm");
            form.reset();
            setInfoMessage(null);
            return;
        }
        getSpecialtiesAction().then((r) => {
            if (r.success && r.data) setSpecialties(r.data.map((s) => ({ value: s.id, label: s.name })));
        });
        getPracticeAreasAction().then((r) => {
            if (r.success && r.data) setPracticeAreas(r.data.map((p) => ({ value: p.id, label: p.name })));
        });
    }, [isOpen]);

    const handleCrmCheck = async () => {
        const crmVal = form.getValues("crm");
        const crmStateVal = form.getValues("crmState");

        if (!crmVal || !crmStateVal) {
            if (!crmVal) form.setError("crm", { message: "Obrigatório" });
            if (!crmStateVal) form.setError("crmState", { message: "Obrigatório" });
            return;
        }

        setCheckingCrm(true);
        form.clearErrors(["crm", "crmState"]);
        setInfoMessage(null);

        try {
            const res = await checkDoctorEligibilityAction(crmVal, crmStateVal);
            if (!res.success || !res.data) {
                toast.error(res.error || "Erro ao verificar CRM");
                setCheckingCrm(false);
                return;
            }

            const status = res.data.status;

            if (status === "active") {
                toast.error("Este médico já está cadastrado e ativo na clínica.");
                setCheckingCrm(false);
                return;
            } else if (status === "inactive") {
                const doc = res.data.doctor as any;
                if (doc) {
                    form.reset({
                        ...form.getValues(),
                        name: doc.name || "",
                        email: doc.email || "",
                        phone: doc.phone || "",
                        crm: doc.crm || crmVal,
                        crmState: doc.crmState || crmStateVal,
                        password: "dummy_password", // Bypass length check for update
                    });
                }
                setDoctorIntent("reactivate");
                setExistingDoctorId(res.data.doctorId);
                setInfoMessage({
                    title: "Cadastro Inativo Encontrado",
                    desc: "Encontramos um cadastro inativo para este médico. Confirme e atualize os dados abaixo para reativar o profissional."
                });
                setStep("details");
            } else if (status === "global") {
                const doc = res.data.doctor as any;
                if (doc) {
                    form.reset({
                        ...form.getValues(),
                        name: doc.name || "",
                        email: doc.email || "",
                        phone: doc.phone || "",
                        crm: doc.crm || crmVal,
                        crmState: doc.crmState || crmStateVal,
                        password: "dummy_password",
                    });
                }
                setDoctorIntent("import");
                setExistingDoctorId(res.data.doctorId);
                setInfoMessage({
                    title: "Médico já existente na plataforma",
                    desc: "Este médico já possui acesso na plataforma. Valide as informações para vinculá-lo a sua clínica."
                });
                setStep("details");
            } else {
                setDoctorIntent("create");
                setInfoMessage(null);
                setStep("details");
            }
        } catch (error) {
            toast.error("Erro ao verificar CRM");
        } finally {
            setCheckingCrm(false);
        }
    };

    const geocodeAddress = async (query: string) => {
        try {
            const res = await fetch(`/api/geocode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: query }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.items?.length > 0) {
                    const { lat, lng } = data.items[0].position;
                    form.setValue("addressLatitude", lat);
                    form.setValue("addressLongitude", lng);
                }
            }
        } catch (e) {
            console.error("Geocoding error", e);
        }
    };

    const handleCepBlur = async () => {
        const raw = form.getValues("addressZipCode")?.replace(/\D/g, "");
        if (raw && raw.length === 8) {
            setIsFetchingCep(true);
            try {
                const info = await cep(raw);
                form.setValue("addressStreet", info.street);
                form.setValue("addressNeighborhood", info.neighborhood);
                form.setValue("addressCity", info.city);
                form.setValue("addressState", info.state);
                await geocodeAddress(`${info.street}, ${info.neighborhood}, ${info.city}, ${info.state}, Brasil`);
                toast.success("CEP encontrado!");
            } catch {
                toast.error("CEP não encontrado.");
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    async function onSubmit(values: DoctorFormValues) {
        setIsPending(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (key === "specialtyIds" && Array.isArray(value)) {
                value.forEach((id) => formData.append("specialtyIds", id));
            } else if (key === "practiceAreaIds" && Array.isArray(value)) {
                value.forEach((id) => formData.append("practiceAreaIds", id));
            } else if (value !== undefined && value !== null && value !== "" && key !== 'password') {
                formData.append(key, value.toString());
            } else if (key === 'password' && doctorIntent === 'create') {
                formData.append(key, value.toString());
            }
        });

        formData.append("intent", doctorIntent);
        if (existingDoctorId) formData.append("globalId", existingDoctorId);

        try {
            const result = await createDoctorAction(formData);
            if (result.success) {
                toast.success(doctorIntent === 'create' ? "Médico cadastrado com sucesso!" : "Médico vinculado/atualizado com sucesso!");
                setIsOpen(false);
                form.reset();
                setStep("crm");
            } else {
                toast.error(result.error || "Erro ao processar requisição do médico");
            }
        } catch {
            toast.error("Erro interno ao salvar médico");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {customTrigger || (
                    <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Médico
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl p-0 border-none shadow-2xl bg-white/95 backdrop-blur-md max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                                {step === 'crm' ? 'Cadastrar Médico' : doctorIntent === 'create' ? 'Novo Cadastro' : 'Vinculação de Cadastro'}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                {step === 'crm' ? 'Busque o médico pelo CRM para iniciar o cadastro.' : 'Revise as informações do profissional para continuar.'}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === "crm" ? (
                        <Form {...form}>
                            <div className="max-w-md mx-auto space-y-8 py-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-foreground/90 text-center">Verificação Prévia</h3>
                                    <p className="text-sm text-muted-foreground text-center">Informe o registro do profissional. O sistema buscará se o médico possui vínculos anteriores.</p>

                                    <div className="grid grid-cols-4 gap-4 mt-6">
                                        <FormField control={form.control} name="crm" render={({ field }) => (
                                            <FormItem className="col-span-3">
                                                <FormLabel>CRM</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="000000" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="crmState" render={({ field }) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel>UF</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all text-center">
                                                            <SelectValue placeholder="UF" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {BRAZILIAN_STATES.map((st) => (
                                                            <SelectItem key={st.value} value={st.value}>{st.value}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                    <Button
                                        type="button"
                                        disabled={checkingCrm}
                                        onClick={handleCrmCheck}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {checkingCrm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                        Avançar
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    ) : (
                        <Form {...form}>
                            <form id="add-doctor-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">

                                {infoMessage && (
                                    <Alert className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm animate-in fade-in slide-in-from-top-4 mb-2">
                                        <Info className="h-5 w-5 text-blue-500" />
                                        <AlertTitle className="font-semibold">{infoMessage.title}</AlertTitle>
                                        <AlertDescription className="text-blue-800/80 mt-1">
                                            {infoMessage.desc}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* ── Top: Informações Básicas ── */}
                                <div className="space-y-5">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-foreground/90">Informações Básicas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl><Input placeholder="Nome do profissional" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1.5"><Mail size={12} className="text-muted-foreground" />Email de Acesso</FormLabel>
                                                <FormControl><Input placeholder="email@exemplo.com" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all font-mono text-xs" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        {doctorIntent === 'create' && (
                                            <FormField control={form.control} name="password" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1.5"><Lock size={12} className="text-muted-foreground" />Senha Provisória</FormLabel>
                                                    <FormControl><Input type="password" placeholder="Mín. 6 caracteres" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        )}

                                        {/* CRM / UF / Telefone */}
                                        <div className={`col-span-2 grid grid-cols-4 gap-4 ${doctorIntent !== 'create' ? 'md:grid-cols-4' : ''}`}>
                                            <FormField control={form.control} name="crm" render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>CRM / Registro</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            <Input readOnly placeholder="000000" {...field} className="h-11 bg-muted/50 border-muted-foreground/10 text-muted-foreground disabled" />
                                                            <Button type="button" variant="outline" onClick={() => setStep("crm")} className="h-11">Alterar</Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="crmState" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>UF</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all">
                                                                <SelectValue placeholder="UF" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {BRAZILIAN_STATES.map((st) => (
                                                                <SelectItem key={st.value} value={st.value}>{st.value}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="phone" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Telefone</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="(00) 00000-0000"
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                                            className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Especialidades + Áreas de Atuação */}
                                        <div className="col-span-2 grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="specialtyIds" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Especialidades</FormLabel>
                                                    <FormControl>
                                                        <ReactSelect isMulti placeholder="Selecione..." options={specialties}
                                                            styles={customSelectStyles}
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                            menuPosition="fixed"
                                                            value={specialties.filter((s) => field.value?.includes(s.value))}
                                                            onChange={(v) => field.onChange(v.map((x) => x.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="practiceAreaIds" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Áreas de Atuação</FormLabel>
                                                    <FormControl>
                                                        <ReactSelect isMulti placeholder="Selecione..." options={practiceAreas}
                                                            styles={customSelectStyles}
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                            menuPosition="fixed"
                                                            value={practiceAreas.filter((p) => field.value?.includes(p.value))}
                                                            onChange={(v) => field.onChange(v.map((x) => x.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                    </div>
                                </div>

                                {/* ── Bottom: Endereço & Mapa ── */}
                                <div className="space-y-5">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-foreground/90">Endereço e Localização</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="addressZipCode" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CEP</FormLabel>
                                                    <div className="relative">
                                                        <FormControl>
                                                            <Input placeholder="00000-000" {...field} maxLength={9} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
                                                                onBlur={(e) => { field.onBlur(); if (e.target.value) handleCepBlur(); }} />
                                                        </FormControl>
                                                        {isFetchingCep && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-muted-foreground" />}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressStreet" render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>Rua/Avenida</FormLabel>
                                                    <FormControl><Input {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressNumber" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Número</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
                                                            onBlur={(e) => {
                                                                field.onBlur();
                                                                const st = form.getValues("addressStreet");
                                                                const city = form.getValues("addressCity");
                                                                if (st && city && e.target.value) {
                                                                    geocodeAddress(`${st}, ${e.target.value}, ${city}, Brasil`);
                                                                }
                                                            }} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressComplement" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Complemento</FormLabel>
                                                    <FormControl><Input {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressNeighborhood" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bairro</FormLabel>
                                                    <FormControl><Input {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressCity" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cidade</FormLabel>
                                                    <FormControl><Input {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressState" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Estado (UF)</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all">
                                                                <SelectValue placeholder="UF" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {BRAZILIAN_STATES.map((st) => (
                                                                <SelectItem key={st.value} value={st.value}>{st.value}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Live Map */}
                                        <div className="flex-1 min-h-[240px]">
                                            <SimpleMap
                                                latitude={addressLatitude}
                                                longitude={addressLongitude}
                                                onCoordinatesChange={(lat, lng) => {
                                                    form.setValue("addressLatitude", lat);
                                                    form.setValue("addressLongitude", lng);
                                                }}
                                                placeholderTitle="Mapa de Localização"
                                                placeholderDescription="Preencha o CEP para o mapa aparecer aqui e você confirmar a localização."
                                                height="100%"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>

                {/* Footer */}
                {step === 'details' && (
                    <DialogFooter className="p-6 bg-muted/20 border-t shrink-0 flex items-center justify-between sm:justify-between rounded-b-lg">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="hover:bg-muted/50 transition-all">
                            Cancelar
                        </Button>
                        <Button type="submit" form="add-doctor-form" disabled={isPending}
                            className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95">
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Check className="mr-2 h-4 w-4" /> {doctorIntent === 'create' ? 'Concluir Cadastro' : 'Vincular Médico'}</>}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
