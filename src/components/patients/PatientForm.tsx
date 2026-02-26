"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useRef } from "react";
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
import { Loader2, Contact, MapPin, Calendar, Check, Hospital, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import cep from "cep-promise";
import { toast } from "sonner";
import ReactSelect from "react-select";
import { checkPatientEligibilityAction } from "@/app/actions/patients/eligibility";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AddDoctorDialog } from "@/components/doctors/AddDoctorDialog";
import { maskCPF, maskPhone } from "@/utils/masks";
import { BRAZILIAN_STATES } from "@/utils/states";
import { createPatientSchema } from "@/lib/validations/patient";

export const patientFormSchema = createPatientSchema;
export type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
    defaultValues: PatientFormValues;
    onSubmit: (values: PatientFormValues, intent: "create" | "reactivate" | "import", globalId?: string) => Promise<void>;
    isPending: boolean;
    doctors: { id: string; name: string | null }[];
    onCancel: () => void;
    mode?: "create" | "edit";
}

export function PatientForm({
    defaultValues,
    onSubmit,
    isPending,
    doctors,
    onCancel,
    mode = "create",
}: PatientFormProps) {
    const [loadingCEP, setLoadingCEP] = useState(false);
    const [step, setStep] = useState<"cpf" | 1 | 2 | 3 | 4>(mode === "edit" ? 1 : "cpf");
    const [checkingCpf, setCheckingCpf] = useState(false);
    const [patientIntent, setPatientIntent] = useState<"create" | "reactivate" | "import">("create");
    const [existingPatientId, setExistingPatientId] = useState<string | undefined>();
    const [infoMessage, setInfoMessage] = useState<{ title: string; desc: string } | null>(null);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues,
    });

    const zipCode = form.watch("zipCode");
    const skipCepLookupRef = useRef(mode === "edit");

    useEffect(() => {
        const cleanCEP = zipCode?.replace(/\D/g, "");
        if (cleanCEP?.length !== 8) return;
        if (mode === "edit" && skipCepLookupRef.current) {
            skipCepLookupRef.current = false;
            return;
        }
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
    }, [zipCode, form, mode]);

    const handleCpfCheck = async () => {
        const cpfVal = form.getValues("cpf");
        if (!cpfVal || cpfVal.length < 11) {
            form.setError("cpf", { message: "CPF inválido" });
            return;
        }

        setCheckingCpf(true);
        form.clearErrors("cpf");
        setInfoMessage(null);

        try {
            const res = await checkPatientEligibilityAction(cpfVal);
            if (!res.success || !res.data) {
                toast.error(res.error || "Erro ao verificar CPF");
                setCheckingCpf(false);
                return;
            }

            const status = res.data.status;

            if (status === "active") {
                toast.error("Este paciente já está cadastrado e ativo na clínica.");
                setCheckingCpf(false);
                return;
            } else if (status === "inactive") {
                const p = res.data.patient;
                if (p) {
                    form.reset({
                        ...form.getValues(),
                        name: p.name || "",
                        email: p.email || "",
                        phone: p.phone || "",
                        birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : "",
                        sex: p.sex || "M",
                    });
                }
                setPatientIntent("reactivate");
                setExistingPatientId(res.data.patientId);
                setInfoMessage({
                    title: "Cadastro Inativo Encontrado",
                    desc: "Encontramos um cadastro inativo para este CPF. Confirme e atualize os dados abaixo para reativar o paciente."
                });
                setStep(1);
            } else if (status === "global") {
                const p = res.data.patient;
                if (p) {
                    form.reset({
                        ...form.getValues(),
                        name: p.name || "",
                        email: p.email || "",
                        phone: p.phone || "",
                        birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : "",
                        sex: p.sex || "M",
                    });
                }
                setPatientIntent("import");
                setExistingPatientId(res.data.patientId);
                setInfoMessage({
                    title: "Paciente já existente na plataforma",
                    desc: "Este paciente já utilizou a plataforma em outra clínica. Valide as informações abaixo para vinculá-lo a sua clínica."
                });
                setStep(1);
            } else {
                setPatientIntent("create");
                setInfoMessage(null);
                setStep(1);
            }

        } catch (error) {
            toast.error("Erro ao verificar CPF");
        } finally {
            setCheckingCpf(false);
        }
    };

    if (mode === "create" && step === "cpf") {
        return (
            <Form {...form}>
                <div className="space-y-6 px-2">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                            <Contact className="h-4 w-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verificação Prévia</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Digite o CPF do paciente para buscar cadastros existentes ou iniciar um novo.</p>
                        <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF do Paciente</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="000.000.000-00"
                                            maxLength={14}
                                            {...field}
                                            value={field.value ? maskCPF(field.value) : ""}
                                            onChange={(e) => field.onChange(maskCPF(e.target.value))}
                                            className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all font-medium text-lg"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCpfCheck();
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="ghost" type="button" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            disabled={checkingCpf}
                            onClick={handleCpfCheck}
                            className="bg-primary hover:bg-primary/90 min-w-[140px]"
                        >
                            {checkingCpf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                            Continuar
                        </Button>
                    </div>
                </div>
            </Form>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => onSubmit(v, patientIntent, existingPatientId))} className="flex flex-col h-full">
                <ScrollArea className="flex-1 pr-4 -mr-4 h-[60vh] max-h-[60vh]">
                    <div className="space-y-8 p-1 pb-6">

                        {mode === "create" && infoMessage && (
                            <Alert className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm animate-in fade-in slide-in-from-top-4">
                                <Info className="h-5 w-5 text-blue-500" />
                                <AlertTitle className="font-semibold">{infoMessage.title}</AlertTitle>
                                <AlertDescription className="text-blue-800/80 mt-1">
                                    {infoMessage.desc}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Passo 1: Dados Pessoais */}
                        {(mode === "edit" || step === 1) && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                                    <Contact className="h-4 w-4 text-primary" />
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dados Pessoais</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cpf"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>CPF</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <Input readOnly placeholder="000.000.000-00" {...field} value={field.value ? maskCPF(field.value) : ""} className="h-11 bg-muted/50 border-muted-foreground/10 text-muted-foreground disabled" />
                                                        {mode === "create" && <Button type="button" variant="outline" onClick={() => setStep("cpf")} className="h-11">Alterar</Button>}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefone</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        maxLength={15}
                                                        {...field}
                                                        value={field.value ? maskPhone(field.value) : ""}
                                                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                                        className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
                                                    />
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
                        )}

                        {/* Passo 2: Endereço */}
                        {(mode === "edit" || step === 2) && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
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
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Passo 3: Como nos conheceu? */}
                        {(mode === "edit" || step === 3) && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                                        <Hospital className="h-4 w-4 text-primary" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Como nos conheceu?</h4>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="originType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex flex-col space-y-2 max-w-sm"
                                                    >
                                                        <FormItem className="flex items-center space-x-3 space-y-0 text-foreground/80 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <FormControl>
                                                                <RadioGroupItem value="instagram" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">Instagram</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0 text-foreground/80 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <FormControl>
                                                                <RadioGroupItem value="google" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">Google</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0 text-foreground/80 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <FormControl>
                                                                <RadioGroupItem value="facebook" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">Facebook</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0 text-foreground/80 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <FormControl>
                                                                <RadioGroupItem value="friends_family" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">Indicação de Parentes ou Amigos</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0 text-foreground/80 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <FormControl>
                                                                <RadioGroupItem value="medical_referral" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">Encaminhamento Médico</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {form.watch("originType") === "medical_referral" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <FormField
                                            control={form.control}
                                            name="referringDoctorId"
                                            render={({ field }) => {
                                                const options = doctors.map(d => ({ value: d.id, label: d.name || "Sem Nome" }));
                                                const selectedOption = options.find(o => o.value === field.value) ?? null;
                                                return (
                                                <FormItem>
                                                    <FormLabel>Médico que encaminhou</FormLabel>
                                                    <div>
                                                        <ReactSelect
                                                            options={options}
                                                            value={selectedOption}
                                                            onChange={(val: { value: string; label: string } | null) => field.onChange(val?.value ?? undefined)}
                                                            onBlur={field.onBlur}
                                                            placeholder="Selecione o médico..."
                                                            isClearable
                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                                            menuPosition="fixed"
                                                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999, pointerEvents: 'auto' }) }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <p className="text-xs text-muted-foreground">
                                                            Não encontrou o médico na lista?
                                                        </p>
                                                        <AddDoctorDialog
                                                            customTrigger={<button type="button" className="text-xs font-medium text-primary hover:underline">Adicionar novo médico</button>}
                                                        />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Passo 4: Vínculo na Clínica */}
                        {(mode === "edit" || step === 4) && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                                    <Hospital className="h-4 w-4 text-primary" />
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vínculo na Clínica</h4>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="responsibleDoctorIds"
                                    render={({ field }) => {
                                        const options = doctors.map(d => ({ value: d.id, label: d.name || "Sem Nome" }));
                                        const selectedOptions = options.filter(o => field.value?.includes(o.value)) ?? [];
                                        return (
                                        <FormItem>
                                            <FormLabel>Médicos Responsáveis (Nossa Clínica)</FormLabel>
                                            <div>
                                                <ReactSelect
                                                    isMulti
                                                    options={options}
                                                    value={selectedOptions}
                                                    onChange={(val) => field.onChange(val ? val.map((v) => v.value) : [])}
                                                    onBlur={field.onBlur}
                                                    placeholder="Selecione médicos..."
                                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                                    menuPosition="fixed"
                                                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999, pointerEvents: 'auto' }) }}
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="flex items-center justify-between pt-4 border-t mt-4 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => mode === "edit" ? onCancel() : (step === 1 ? onCancel() : (typeof step === "number" ? setStep((step - 1) as 1 | 2 | 3 | 4) : onCancel()))}
                        className="hover:bg-muted/50 transition-all"
                    >
                        {mode === "edit" || step === 1 ? "Cancelar" : "Voltar"}
                    </Button>
                    <Button
                        type={mode === "edit" || step === 4 ? "submit" : "button"}
                        disabled={isPending}
                        onClick={mode === "edit" ? undefined : async (e) => {
                            if (step !== 4) {
                                e.preventDefault();
                                if (step === 1) {
                                    const isValid = await form.trigger(["name", "email", "phone", "birthDate", "sex"]);
                                    if (isValid) setStep(2);
                                } else if (step === 2) {
                                    const isValid = await form.trigger(["zipCode", "street", "number", "neighborhood", "city", "state"]);
                                    if (isValid) setStep(3);
                                } else if (step === 3) {
                                    const isValid = await form.trigger(["originType", "referringDoctorId"]);
                                    if (isValid) setStep(4);
                                }
                            }
                        }}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : mode === "edit" || step === 4 ? (
                            <><Check className="mr-2 h-4 w-4" /> {mode === "edit" ? "Salvar Alterações" : patientIntent === "create" ? "Salvar Paciente" : patientIntent === "reactivate" ? "Reativar Paciente" : "Vincular Paciente"}</>
                        ) : (
                            <>Próximo <ArrowRight className="ml-2 h-4 w-4" /></>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
