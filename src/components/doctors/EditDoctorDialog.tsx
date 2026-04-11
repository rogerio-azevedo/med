"use client";

import { startTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowRightLeft,
    Check,
    Loader2,
    Mail,
    Pencil,
    Plus,
    Trash2,
    UserPlus,
} from "lucide-react";
import {
    assignPatientReferralToDoctorAction,
    getDoctorReferralDoctorOptionsAction,
    getDoctorReferralPatientOptionsAction,
    removePatientReferralFromDoctorAction,
    updateDoctorAction,
} from "@/app/actions/doctors";
import { getSpecialtiesAction } from "@/app/actions/specialties";
import { getPracticeAreasAction } from "@/app/actions/practice-areas";
import { getActiveHealthInsurancesAction } from "@/app/actions/health-insurances";
import { toast } from "sonner";
import ReactSelect from "react-select";
import type { GroupBase, MultiValue, StylesConfig } from "react-select";
import cep from "cep-promise";
import { maskPhone } from "@/utils/masks";

const SimpleMap = dynamic(
    () => import("@/components/maps/SimpleMap").then((m) => m.SimpleMap),
    { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted rounded-xl min-h-[260px]" /> }
);

const doctorFormSchema = z.object({
    id: z.string(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    relationshipType: z.enum(["linked", "partner"]),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    phone: z.string().optional(),
    specialtyIds: z.array(z.string()).optional(),
    practiceAreaIds: z.array(z.string()).optional(),
    healthInsuranceIds: z.array(z.string()).optional(),
    addressZipCode: z.string().optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressLatitude: z.number().optional(),
    addressLongitude: z.number().optional(),
    observations: z.string().optional(),
});

type SelectOption = { value: string; label: string };
type SingleSelectOption = { value: string; label: string };
type PatientOption = { id: string; name: string; cpf: string | null };
type DoctorReferralOption = {
    id: string;
    name: string | null;
    relationshipType: "linked" | "partner";
};
type ReferredPatient = {
    patientId: string;
    patientName: string;
    createdAt: Date;
    source: "patient_reported" | "doctor_reported" | "invite_link" | "manual";
};

const customSelectStyles: StylesConfig<SelectOption, true, GroupBase<SelectOption>> = {
    control: (base, state) => ({
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
    menu: (base) => ({
        ...base,
        backgroundColor: "white",
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        padding: "4px",
        zIndex: 50,
    }),
    option: (base, state) => ({
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
    multiValue: (base) => ({
        ...base,
        backgroundColor: "hsl(var(--primary) / 0.1)",
        borderRadius: "1rem",
        padding: "2px 8px",
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "hsl(var(--primary))",
        fontWeight: "500",
        fontSize: "12px",
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: "hsl(var(--primary))",
        "&:hover": {
            backgroundColor: "hsl(var(--primary) / 0.2)",
            color: "hsl(var(--primary))",
            borderRadius: "1rem",
        }
    })
};

const singleSelectStyles: StylesConfig<SingleSelectOption, false, GroupBase<SingleSelectOption>> = {
    control: (base, state) => ({
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
    menu: (base) => ({
        ...base,
        backgroundColor: "white",
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        padding: "4px",
        zIndex: 50,
    }),
    option: (base, state) => ({
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
};

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

interface EditDoctorDialogProps {
    doctor: {
        id: string;
        name: string | null;
        email: string | null;
        crm: string | null;
        crmState: string | null;
        phone: string | null;
        specialties: { id: string; name: string }[];
        practiceAreas: { id: string; name: string }[];
        healthInsurances: { id: string; name: string }[];
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
        relationshipType: "linked" | "partner";
        observations?: string | null;
        referredPatients?: {
            patientId: string;
            patientName: string;
            createdAt: Date;
            source: "patient_reported" | "doctor_reported" | "invite_link" | "manual";
        }[];
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onReferredPatientsChange?: (patients: ReferredPatient[]) => void;
}

export function EditDoctorDialog({ doctor, isOpen, onOpenChange, onReferredPatientsChange }: EditDoctorDialogProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [practiceAreas, setPracticeAreas] = useState<{ value: string; label: string }[]>([]);
    const [healthInsurances, setHealthInsurances] = useState<{ value: string; label: string }[]>([]);
    const [referredPatients, setReferredPatients] = useState<ReferredPatient[]>(doctor.referredPatients ?? []);
    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
    const [loadingPatientOptions, setLoadingPatientOptions] = useState(false);
    const [doctorOptions, setDoctorOptions] = useState<DoctorReferralOption[]>([]);
    const [loadingDoctorOptions, setLoadingDoctorOptions] = useState(false);
    const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
    const [isSavingReferral, setIsSavingReferral] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [referralSource, setReferralSource] = useState<"patient_reported" | "doctor_reported" | "manual">("patient_reported");
    const [referralNotes, setReferralNotes] = useState("");
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [transferPatient, setTransferPatient] = useState<ReferredPatient | null>(null);
    const [selectedTransferDoctorId, setSelectedTransferDoctorId] = useState("");
    const [transferSource, setTransferSource] = useState<"patient_reported" | "doctor_reported" | "manual">("manual");
    const [transferNotes, setTransferNotes] = useState("");
    const [isTransferringReferral, setIsTransferringReferral] = useState(false);
    const [removingPatientId, setRemovingPatientId] = useState<string | null>(null);
    const patientSelectOptions = patientOptions.map((patient) => ({
        value: patient.id,
        label: patient.cpf ? `${patient.name} (${patient.cpf})` : patient.name,
    }));

    const form = useForm<DoctorFormValues>({
        resolver: zodResolver(doctorFormSchema),
        defaultValues: {
            id: doctor.id,
            name: doctor.name || "",
            email: doctor.email || "",
            relationshipType: doctor.relationshipType,
            crm: doctor.crm || "",
            crmState: doctor.crmState || "",
            specialtyIds: [],
            practiceAreaIds: [],
            healthInsuranceIds: [],
            addressZipCode: "",
            addressStreet: "",
            addressNumber: "",
            addressComplement: "",
            addressNeighborhood: "",
            addressCity: "",
            addressState: "",
            observations: "",
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
            getActiveHealthInsurancesAction().then((result) => {
                if (result.success && result.data) {
                    setHealthInsurances(result.data.map((item) => ({ value: item.id, label: item.name })));
                }
            });
            setReferredPatients(doctor.referredPatients ?? []);
            form.reset({
                id: doctor.id,
                name: doctor.name || "",
                email: doctor.email || "",
                relationshipType: doctor.relationshipType,
                crm: doctor.crm || "",
                crmState: doctor.crmState || "",
                phone: doctor.phone ? maskPhone(doctor.phone) : "",
                specialtyIds: doctor.specialties.map(s => s.id),
                practiceAreaIds: doctor.practiceAreas.map(pa => pa.id),
                healthInsuranceIds: doctor.healthInsurances.map((item) => item.id),
                addressZipCode: doctor.address?.zipCode || "",
                addressStreet: doctor.address?.street || "",
                addressNumber: doctor.address?.number || "",
                addressComplement: doctor.address?.complement || "",
                addressNeighborhood: doctor.address?.neighborhood || "",
                addressCity: doctor.address?.city || "",
                addressState: doctor.address?.state || "",
                addressLatitude: doctor.address?.latitude || undefined,
                addressLongitude: doctor.address?.longitude || undefined,
                observations: doctor.observations || "",
            });
        }
    }, [isOpen, doctor, form]);

    useEffect(() => {
        if (!isReferralDialogOpen) {
            return;
        }

        setLoadingPatientOptions(true);
        getDoctorReferralPatientOptionsAction()
            .then((result) => {
                if (result.success) {
                    setPatientOptions(result.patients);
                }
            })
            .finally(() => {
                setLoadingPatientOptions(false);
            });
    }, [isReferralDialogOpen]);

    useEffect(() => {
        if (!isTransferDialogOpen) {
            return;
        }

        setLoadingDoctorOptions(true);
        getDoctorReferralDoctorOptionsAction()
            .then((result) => {
                if (result.success) {
                    setDoctorOptions(result.doctors);
                }
            })
            .finally(() => {
                setLoadingDoctorOptions(false);
            });
    }, [isTransferDialogOpen]);

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
            } else if (key === "healthInsuranceIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("healthInsuranceIds", id));
            } else if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value.toString());
            }
        });

        try {
            const result = await updateDoctorAction(formData);
            if (result.success) {
                toast.success("Dados do médico atualizados!");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao atualizar médico");
            }
        } catch {
            toast.error("Erro ao atualizar médico");
        } finally {
            setIsPending(false);
        }
    }

    async function handleAssignReferralPatient() {
        if (!selectedPatientId) {
            toast.error("Selecione um paciente para vincular.");
            return;
        }

        setIsSavingReferral(true);

        try {
            const result = await assignPatientReferralToDoctorAction({
                doctorId: doctor.id,
                patientId: selectedPatientId,
                referralSource,
                referralNotes: referralNotes.trim() || undefined,
            });

            if (!result.success) {
                toast.error(result.error || "Erro ao vincular paciente.");
                return;
            }

            if (result.patient) {
                const patient = result.patient;
                startTransition(() => {
                    setReferredPatients((current) => {
                        const next = current.filter((item) => item.patientId !== patient.patientId);
                        next.unshift({
                            patientId: patient.patientId,
                            patientName: patient.patientName,
                            createdAt: new Date(patient.createdAt),
                            source: patient.source,
                        });
                        onReferredPatientsChange?.(next);
                        return next;
                    });
                });
            }

            toast.success("Paciente vinculado como indicação do médico.");
            setIsReferralDialogOpen(false);
            setSelectedPatientId("");
            setReferralSource("patient_reported");
            setReferralNotes("");
            router.refresh();
        } catch {
            toast.error("Erro ao vincular paciente.");
        } finally {
            setIsSavingReferral(false);
        }
    }

    async function handleRemoveReferralPatient(patient: ReferredPatient) {
        setRemovingPatientId(patient.patientId);

        try {
            const result = await removePatientReferralFromDoctorAction({
                doctorId: doctor.id,
                patientId: patient.patientId,
            });

            if (!result.success) {
                toast.error(result.error || "Erro ao remover indicação.");
                return;
            }

            startTransition(() => {
                setReferredPatients((current) => {
                    const next = current.filter((item) => item.patientId !== patient.patientId);
                    onReferredPatientsChange?.(next);
                    return next;
                });
            });

            toast.success("Indicação removida com sucesso.");
            router.refresh();
        } catch {
            toast.error("Erro ao remover indicação.");
        } finally {
            setRemovingPatientId(null);
        }
    }

    async function handleTransferReferralPatient() {
        if (!transferPatient || !selectedTransferDoctorId) {
            toast.error("Selecione o médico de destino.");
            return;
        }

        setIsTransferringReferral(true);

        try {
            const result = await assignPatientReferralToDoctorAction({
                doctorId: selectedTransferDoctorId,
                patientId: transferPatient.patientId,
                referralSource: transferSource,
                referralNotes: transferNotes.trim() || undefined,
            });

            if (!result.success) {
                toast.error(result.error || "Erro ao transferir indicação.");
                return;
            }

            startTransition(() => {
                setReferredPatients((current) => {
                    const next = current.filter((item) => item.patientId !== transferPatient.patientId);
                    onReferredPatientsChange?.(next);
                    return next;
                });
            });

            toast.success("Indicação transferida com sucesso.");
            setIsTransferDialogOpen(false);
            setTransferPatient(null);
            setSelectedTransferDoctorId("");
            setTransferSource("manual");
            setTransferNotes("");
            router.refresh();
        } catch {
            toast.error("Erro ao transferir indicação.");
        } finally {
            setIsTransferringReferral(false);
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

                                    <FormField
                                        control={form.control}
                                        name="relationshipType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Relação</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all">
                                                            <SelectValue placeholder="Selecione o vínculo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="linked">Médico Vinculado</SelectItem>
                                                        <SelectItem value="partner">Médico Parceiro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* CRM / UF / Telefone */}
                                    <div className="col-span-2 grid grid-cols-4 gap-4">
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
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
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
                                            )}
                                        />
                                    </div>

                                    {/* Especialidades + Áreas de Atuação lado a lado */}
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
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
                                                            onChange={(val: MultiValue<SelectOption>) => field.onChange(val.map((v) => v.value))}
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
                                                <FormItem>
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
                                                            onChange={(val: MultiValue<SelectOption>) => field.onChange(val.map((v) => v.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="healthInsuranceIds"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Convênios Aceitos</FormLabel>
                                                <FormControl>
                                                    <ReactSelect
                                                        isMulti
                                                        placeholder="Selecione..."
                                                        options={healthInsurances}
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        styles={customSelectStyles}
                                                        value={healthInsurances.filter((item) => field.value?.includes(item.value))}
                                                        onChange={(val: MultiValue<SelectOption>) => field.onChange(val.map((v) => v.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="observations"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Observações</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Informações adicionais sobre o médico..."
                                                        className="resize-none min-h-[100px] bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
                                                        {...field}
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

                            <div className="space-y-5">
                                <div className="flex items-center justify-between gap-3 border-b pb-2">
                                    <h3 className="text-lg font-semibold text-foreground/90">Pacientes Indicados</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="rounded-full">
                                            {referredPatients.length}
                                        </Badge>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsReferralDialogOpen(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Vincular Paciente
                                        </Button>
                                    </div>
                                </div>
                                {referredPatients.length > 0 ? (
                                    <div className="grid gap-3">
                                        {referredPatients.map((patient) => (
                                            <div
                                                key={patient.patientId}
                                                className="rounded-xl border bg-muted/20 px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-foreground/90">{patient.patientName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Indicado em {new Date(patient.createdAt).toLocaleDateString("pt-BR")}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="capitalize">
                                                            {patient.source.replace(/_/g, " ")}
                                                        </Badge>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setTransferPatient(patient);
                                                                setSelectedTransferDoctorId("");
                                                                setTransferSource("manual");
                                                                setTransferNotes("");
                                                                setIsTransferDialogOpen(true);
                                                            }}
                                                        >
                                                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                            Transferir
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={removingPatientId === patient.patientId}
                                                            onClick={() => handleRemoveReferralPatient(patient)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {removingPatientId === patient.patientId ? "Removendo..." : "Remover"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                                        Nenhum paciente indicado por este médico até o momento.
                                    </div>
                                )}
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

            <Dialog
                open={isReferralDialogOpen}
                onOpenChange={(open) => {
                    setIsReferralDialogOpen(open);
                    if (!open) {
                        setSelectedPatientId("");
                        setReferralSource("patient_reported");
                        setReferralNotes("");
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-xl"
                    onInteractOutside={(e) => {
                        const target = e.target as HTMLElement;
                        if (target?.closest?.(".react-select__menu, .react-select__menu-portal")) {
                            e.preventDefault();
                        }
                    }}
                >
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>Vincular Paciente Indicado</DialogTitle>
                                <DialogDescription>
                                    Registre um paciente da clínica como indicado por {doctor.name ?? "este médico"}.
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Paciente
                                </label>
                                <ReactSelect<SingleSelectOption, false>
                                    options={patientSelectOptions}
                                    value={patientSelectOptions.find((option) => option.value === selectedPatientId) ?? null}
                                    onChange={(option: SingleSelectOption | null) =>
                                        setSelectedPatientId(option?.value ?? "")
                                    }
                                    isLoading={loadingPatientOptions}
                                    placeholder="Selecione um paciente da clínica..."
                                    classNamePrefix="react-select"
                                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                    menuPosition="fixed"
                                    styles={{
                                        ...singleSelectStyles,
                                        menuPortal: (base) => ({ ...base, zIndex: 9999, pointerEvents: "auto" }),
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Como essa indicação foi registrada?
                                </label>
                                <Select
                                    value={referralSource}
                                    onValueChange={(value: "patient_reported" | "doctor_reported" | "manual") =>
                                        setReferralSource(value)
                                    }
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="patient_reported">Informado pelo paciente</SelectItem>
                                        <SelectItem value="doctor_reported">Informado pelo médico</SelectItem>
                                        <SelectItem value="manual">Ajuste manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Observações
                                </label>
                                <Textarea
                                    value={referralNotes}
                                    onChange={(event) => setReferralNotes(event.target.value)}
                                    placeholder="Ex.: médico ligou antecipando a chegada do paciente."
                                    className="min-h-[120px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsReferralDialogOpen(false)} disabled={isSavingReferral}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAssignReferralPatient} disabled={isSavingReferral || !selectedPatientId}>
                                {isSavingReferral ? "Vinculando..." : "Vincular Paciente"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isTransferDialogOpen}
                onOpenChange={(open) => {
                    setIsTransferDialogOpen(open);
                    if (!open) {
                        setTransferPatient(null);
                        setSelectedTransferDoctorId("");
                        setTransferSource("manual");
                        setTransferNotes("");
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-xl"
                    onInteractOutside={(e) => {
                        const target = e.target as HTMLElement;
                        if (target?.closest?.(".react-select__menu")) {
                            e.preventDefault();
                        }
                    }}
                >
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                <ArrowRightLeft className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>Transferir Indicação</DialogTitle>
                                <DialogDescription>
                                    {transferPatient
                                        ? `Transfira ${transferPatient.patientName} para outro médico indicador da clínica.`
                                        : "Selecione o novo médico indicador para este paciente."}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Paciente
                                </label>
                                <Input value={transferPatient?.patientName ?? ""} disabled />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Novo médico indicador
                                </label>
                                <Select
                                    value={selectedTransferDoctorId}
                                    onValueChange={setSelectedTransferDoctorId}
                                    disabled={loadingDoctorOptions}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue
                                            placeholder={
                                                loadingDoctorOptions
                                                    ? "Carregando médicos..."
                                                    : "Selecione o médico de destino"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctorOptions
                                            .filter((option) => option.id !== doctor.id)
                                            .map((option) => (
                                                <SelectItem key={option.id} value={option.id}>
                                                    {option.name ?? "Médico sem nome"}{" "}
                                                    {option.relationshipType === "partner"
                                                        ? "(Parceiro)"
                                                        : "(Vinculado)"}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Como essa troca foi registrada?
                                </label>
                                <Select
                                    value={transferSource}
                                    onValueChange={(value: "patient_reported" | "doctor_reported" | "manual") =>
                                        setTransferSource(value)
                                    }
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="patient_reported">Informado pelo paciente</SelectItem>
                                        <SelectItem value="doctor_reported">Informado pelo médico</SelectItem>
                                        <SelectItem value="manual">Ajuste manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Observações
                                </label>
                                <Textarea
                                    value={transferNotes}
                                    onChange={(event) => setTransferNotes(event.target.value)}
                                    placeholder="Ex.: indicação corrigida após contato da clínica."
                                    className="min-h-[120px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsTransferDialogOpen(false)}
                                disabled={isTransferringReferral}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleTransferReferralPatient}
                                disabled={isTransferringReferral || !transferPatient || !selectedTransferDoctorId}
                            >
                                {isTransferringReferral ? "Transferindo..." : "Transferir Indicação"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
