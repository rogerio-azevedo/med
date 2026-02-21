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
import { Loader2, Mail, Check, Pencil } from "lucide-react";
import { updateDoctorAction } from "@/app/actions/doctors";
import { getSpecialtiesAction } from "@/app/actions/specialties";
import { getPracticeAreasAction } from "@/app/actions/practice-areas";
import { toast } from "sonner";
import ReactSelect from "react-select";
import cep from "cep-promise";

const SimpleMap = dynamic(
    () => import("@/components/maps/SimpleMap").then((m) => m.SimpleMap),
    { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted rounded-xl min-h-[260px]" /> }
);

const doctorFormSchema = z.object({
    id: z.string(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    specialtyIds: z.array(z.string()).min(1, "Selecione pelo menos uma especialidade"),
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

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

interface EditDoctorDialogProps {
    doctor: {
        id: string;
        name: string | null;
        email: string | null;
        crm: string | null;
        crmState: string | null;
        specialties: { id: string; name: string }[];
        practiceAreas: { id: string; name: string }[];
        address?: {
            zipCode?: string | null;
            street?: string | null;
            number?: string | null;
            complement?: string | null;
            neighborhood?: string | null;
            city?: string | null;
            state?: string | null;
            latitude?: number | null;
            longitude?: number | null;
        } | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditDoctorDialog({ doctor, isOpen, onOpenChange }: EditDoctorDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [practiceAreas, setPracticeAreas] = useState<{ value: string; label: string }[]>([]);

    const form = useForm<DoctorFormValues>({
        resolver: zodResolver(doctorFormSchema),
        defaultValues: {
            id: doctor.id,
            name: doctor.name || "",
            email: doctor.email || "",
            crm: doctor.crm || "",
            crmState: doctor.crmState || "",
            specialtyIds: [],
            practiceAreaIds: [],
            addressZipCode: "",
            addressStreet: "",
            addressNumber: "",
            addressComplement: "",
            addressNeighborhood: "",
            addressCity: "",
            addressState: "",
        },
    });

    const addressLatitude = form.watch("addressLatitude");
    const addressLongitude = form.watch("addressLongitude");

    useEffect(() => {
        if (isOpen) {
            getSpecialtiesAction().then((result) => {
                if (result.success && result.data) {
                    setSpecialties(result.data.map(s => ({ value: s.id, label: s.name })));
                }
            });
            getPracticeAreasAction().then((result) => {
                if (result.success && result.data) {
                    setPracticeAreas(result.data.map(pa => ({ value: pa.id, label: pa.name })));
                }
            });
            form.reset({
                id: doctor.id,
                name: doctor.name || "",
                email: doctor.email || "",
                crm: doctor.crm || "",
                crmState: doctor.crmState || "",
                specialtyIds: doctor.specialties.map(s => s.id),
                practiceAreaIds: doctor.practiceAreas.map(pa => pa.id),
                addressZipCode: doctor.address?.zipCode || "",
                addressStreet: doctor.address?.street || "",
                addressNumber: doctor.address?.number || "",
                addressComplement: doctor.address?.complement || "",
                addressNeighborhood: doctor.address?.neighborhood || "",
                addressCity: doctor.address?.city || "",
                addressState: doctor.address?.state || "",
                addressLatitude: doctor.address?.latitude || undefined,
                addressLongitude: doctor.address?.longitude || undefined,
            });
        }
    }, [isOpen, doctor, form]);

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
                value.forEach(id => formData.append("specialtyIds", id));
            } else if (key === "practiceAreaIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("practiceAreaIds", id));
            } else if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value.toString());
            }
        });

        try {
            const result = await updateDoctorAction(formData);
            if (result.success) {
                toast.success("Dados do médico atualizados!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao atualizar médico");
            }
        } catch (error) {
            toast.error("Erro ao atualizar médico");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl p-0 border-none shadow-2xl bg-white/95 backdrop-blur-md max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <Pencil size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Editar Médico</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Atualize as informações e localização do profissional.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <Form {...form}>
                        <form id="edit-doctor-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">

                            {/* Top: Informações Básicas */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-semibold border-b pb-2 text-foreground/90">Informações Básicas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do profissional" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Mail size={12} className="text-muted-foreground" />
                                                    Email de Acesso
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="email@exemplo.com" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all font-mono text-xs" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="crm"
                                            render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>CRM / Registro</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="000000" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="crmState"
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

                                    <FormField
                                        control={form.control}
                                        name="specialtyIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Especialidades</FormLabel>
                                                <FormControl>
                                                    <ReactSelect
                                                        isMulti
                                                        placeholder="Selecione..."
                                                        options={specialties}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        styles={customSelectStyles}
                                                        value={specialties.filter(s => field.value?.includes(s.value))}
                                                        onChange={(val) => field.onChange(val.map(v => v.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="practiceAreaIds"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Áreas de Atuação</FormLabel>
                                                <FormControl>
                                                    <ReactSelect
                                                        isMulti
                                                        placeholder="Selecione..."
                                                        options={practiceAreas}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        styles={customSelectStyles}
                                                        value={practiceAreas.filter(pa => field.value?.includes(pa.value))}
                                                        onChange={(val) => field.onChange(val.map(v => v.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="col-span-1 md:col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/10 mt-2">
                                        <p className="text-[11px] text-primary/70 font-medium leading-relaxed italic">
                                            Nota: A alteração do email afetará o login do médico.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Endereço & Mapa */}
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

                <DialogFooter className="p-6 bg-muted/20 border-t shrink-0 flex items-center justify-between sm:justify-between rounded-b-lg">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-muted/50 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="edit-doctor-form"
                        disabled={isPending}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" /> Salvar Alterações</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
