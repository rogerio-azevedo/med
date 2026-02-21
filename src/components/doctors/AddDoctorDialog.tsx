"use client";

import { useState, useEffect } from "react";
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
import { Stethoscope, Loader2, Mail, Lock, ShieldCheck, Check } from "lucide-react";
import { createDoctorAction } from "@/app/actions/doctors";
import { getSpecialtiesAction } from "@/app/actions/specialties";
import { getPracticeAreasAction } from "@/app/actions/practice-areas";
import { toast } from "sonner";
import ReactSelect from "react-select";
import cep from "cep-promise";
import { maskPhone } from "@/lib/masks";

const SimpleMap = dynamic(
    () => import("@/components/maps/SimpleMap").then((m) => m.SimpleMap),
    { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted rounded-xl min-h-[260px]" /> }
);

const doctorFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
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

export function AddDoctorDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [practiceAreas, setPracticeAreas] = useState<{ value: string; label: string }[]>([]);

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
        if (!isOpen) return;
        getSpecialtiesAction().then((r) => {
            if (r.success && r.data) setSpecialties(r.data.map((s) => ({ value: s.id, label: s.name })));
        });
        getPracticeAreasAction().then((r) => {
            if (r.success && r.data) setPracticeAreas(r.data.map((p) => ({ value: p.id, label: p.name })));
        });
    }, [isOpen]);

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
            } else if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value.toString());
            }
        });

        try {
            const result = await createDoctorAction(formData);
            if (result.success) {
                toast.success("Médico cadastrado com sucesso!");
                setIsOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Erro ao cadastrar médico");
            }
        } catch {
            toast.error("Erro ao cadastrar médico");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Adicionar Médico
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl p-0 border-none shadow-2xl bg-white/95 backdrop-blur-md max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Cadastrar Médico</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Preencha as informações do profissional e confirme o endereço no mapa.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <Form {...form}>
                        <form id="add-doctor-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">

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

                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5"><Lock size={12} className="text-muted-foreground" />Senha Provisória</FormLabel>
                                            <FormControl><Input type="password" placeholder="Mín. 6 caracteres" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* CRM / UF / Telefone */}
                                    <div className="col-span-2 grid grid-cols-4 gap-4">
                                        <FormField control={form.control} name="crm" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>CRM / Registro</FormLabel>
                                                <FormControl><Input placeholder="000000" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="crmState" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>UF</FormLabel>
                                                <FormControl><Input placeholder="SP" maxLength={2} {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all uppercase" /></FormControl>
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
                                                <FormControl><Input placeholder="SP" maxLength={2} {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all uppercase max-w-[80px]" /></FormControl>
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
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 bg-muted/20 border-t shrink-0 flex items-center justify-between sm:justify-between rounded-b-lg">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="hover:bg-muted/50 transition-all">
                        Cancelar
                    </Button>
                    <Button type="submit" form="add-doctor-form" disabled={isPending}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95">
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Check className="mr-2 h-4 w-4" /> Concluir Cadastro</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
