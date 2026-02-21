"use client";

import { useActionState, Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Check, Hospital, User, ShieldCheck, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { register, getInvite } from "../../actions/auth";
import { getSpecialtiesAction } from "@/app/actions/specialties";
import ReactSelect from "react-select";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import cep from "cep-promise";

// Brazilian States
const BRAZILIAN_STATES = [
    { label: "Acre", value: "AC" },
    { label: "Alagoas", value: "AL" },
    { label: "Amapá", value: "AP" },
    { label: "Amazonas", value: "AM" },
    { label: "Bahia", value: "BA" },
    { label: "Ceará", value: "CE" },
    { label: "Distrito Federal", value: "DF" },
    { label: "Espírito Santo", value: "ES" },
    { label: "Goiás", value: "GO" },
    { label: "Maranhão", value: "MA" },
    { label: "Mato Grosso", value: "MT" },
    { label: "Mato Grosso do Sul", value: "MS" },
    { label: "Minas Gerais", value: "MG" },
    { label: "Pará", value: "PA" },
    { label: "Paraíba", value: "PB" },
    { label: "Paraná", value: "PR" },
    { label: "Pernambuco", value: "PE" },
    { label: "Piauí", value: "PI" },
    { label: "Rio de Janeiro", value: "RJ" },
    { label: "Rio Grande do Norte", value: "RN" },
    { label: "Rio Grande do Sul", value: "RS" },
    { label: "Rondônia", value: "RO" },
    { label: "Roraima", value: "RR" },
    { label: "Santa Catarina", value: "SC" },
    { label: "São Paulo", value: "SP" },
    { label: "Sergipe", value: "SE" },
    { label: "Tocantins", value: "TO" },
];

// Input Masks
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})\d+?$/, "$1");
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{3})\d+?$/, "$1");
};

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

function RegisterForm() {
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get("invite");
    const [state, action, isPending] = useActionState(register, null);

    const [inviteData, setInviteData] = useState<{ role: string, clinicName?: string } | null>(null);
    const [loadingInvite, setLoadingInvite] = useState(!!inviteCode);
    const [loadingCEP, setLoadingCEP] = useState(false);
    const [step, setStep] = useState(1);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);

    // Form fields state for validation and masks
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        cpf: "",
        phone: "",
        crm: "",
        crmState: "",
        birthDate: "",
        sex: "M",
        zipCode: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        complement: "",
        specialtyIds: [] as string[]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === "cpf") maskedValue = maskCPF(value);
        if (name === "phone") maskedValue = maskPhone(value);
        if (name === "zipCode") maskedValue = maskCEP(value);

        setFormData(prev => ({ ...prev, [name]: maskedValue }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (name: string, value: string[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Geocode helper
    const geocodeAddress = async (query: string) => {
        try {
            const res = await fetch(`/api/geocode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: query }),
            });
            if (res.ok) {
                const geoData = await res.json();
                if (geoData.items?.length > 0) {
                    const { lat, lng } = geoData.items[0].position;
                    setMapCoords({ lat, lng });
                }
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
    };

    // CEP Lookup Effect
    useEffect(() => {
        const cleanCEP = formData.zipCode.replace(/\D/g, "");
        if (cleanCEP.length === 8) {
            setLoadingCEP(true);
            cep(cleanCEP)
                .then((data) => {
                    setFormData(prev => ({
                        ...prev,
                        street: data.street || "",
                        neighborhood: data.neighborhood || "",
                        city: data.city || "",
                        state: data.state || ""
                    }));
                    // Auto-geocode
                    geocodeAddress(`${data.street}, ${data.neighborhood}, ${data.city}, ${data.state}, Brasil`);
                })
                .catch((err) => {
                    console.error("Erro ao buscar CEP:", err);
                })
                .finally(() => {
                    setLoadingCEP(false);
                });
        }
    }, [formData.zipCode]);

    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            const timer = setTimeout(() => {
                router.push("/login?registered=true");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state?.success, router]);

    useEffect(() => {
        if (inviteCode) {
            getInvite(inviteCode).then((invite) => {
                if (invite) {
                    setInviteData({ role: invite.role, clinicName: invite.clinicName });
                }
                setLoadingInvite(false);
            });
        }
        getSpecialtiesAction().then((r) => {
            if (r.success && r.data) setSpecialties(r.data.map((s) => ({ value: s.id, label: s.name })));
        });
    }, [inviteCode]);

    const nextStep = () => {
        if (step < 3) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    // Validation (simple)
    const isStep1Valid = formData.email && formData.password.length >= 6;
    const isStep2Valid = formData.name && (
        inviteData?.role === 'doctor' ? (formData.crm && formData.crmState) :
            inviteData?.role === 'patient' ? (formData.cpf && formData.phone) : true
    );

    if (loadingInvite) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Validando seu convite...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden bg-white/80 backdrop-blur-sm">
            {/* Multi-step progress bar */}
            <div className="flex h-1.5 w-full bg-muted/30">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <CardHeader className="space-y-4 pt-8 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        {inviteData?.role === 'doctor' ? <ShieldCheck size={28} /> :
                            inviteData?.role === 'patient' ? <User size={28} /> :
                                <Hospital size={28} />}
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo ao Med</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-1.5 font-medium">
                            {inviteData?.clinicName ? (
                                <>A <span className="text-primary font-bold underline underline-offset-2 decoration-primary/30">{inviteData.clinicName}</span> te convidou.</>
                            ) : inviteCode ? (
                                "Você foi convidado para se registrar na plataforma."
                            ) : (
                                "Crie sua conta para começar."
                            )}
                        </CardDescription>
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between items-center px-1 pt-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center space-y-1">
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300",
                                s === step ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" :
                                    s < step ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                            )}>
                                {s < step ? <Check size={14} strokeWidth={3} /> : s}
                            </div>
                            <span className={cn(
                                "text-[10px] uppercase tracking-wider font-bold",
                                s === step ? "text-primary" : "text-muted-foreground/70"
                            )}>
                                {s === 1 ? "Conta" : s === 2 ? "Perfil" : "Endereço"}
                            </span>
                        </div>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="pt-2 pb-6 px-8">
                <form action={action} className="space-y-6">
                    {inviteCode && <input type="hidden" name="invite" value={inviteCode} />}

                    {/* Step 1: Account */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email de Acesso</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                                <p className="text-[11px] text-muted-foreground">Este será seu login principal no sistema.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Sua Senha</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Profile */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Como quer ser chamado?"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {inviteData?.role === 'doctor' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="crm">CRM</Label>
                                            <Input id="crm" name="crm" placeholder="000000" value={formData.crm} onChange={handleChange} required className="h-11" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="crmState">UF</Label>
                                            <Select name="crmState" value={formData.crmState} onValueChange={(v) => handleSelectChange("crmState", v)}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="UF" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BRAZILIAN_STATES.map((st) => (
                                                        <SelectItem key={st.value} value={st.value}>{st.value}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Telefone</Label>
                                        <Input id="phone" name="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} className="h-11" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Especialidades (Opcional)</Label>
                                        <ReactSelect
                                            isMulti
                                            placeholder="Selecione..."
                                            options={specialties}
                                            styles={customSelectStyles}
                                            className="react-select-container h-11"
                                            classNamePrefix="react-select"
                                            value={specialties.filter((s) => formData.specialtyIds?.includes(s.value))}
                                            onChange={(v) => handleMultiSelectChange("specialtyIds", v.map((x) => x.value))}
                                        />
                                    </div>
                                </div>
                            )}

                            {inviteData?.role === 'patient' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cpf">CPF</Label>
                                        <Input id="cpf" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} required className="h-11" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Telefone</Label>
                                        <Input id="phone" name="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleChange} required className="h-11" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="birthDate">Nascimento</Label>
                                        <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required className="h-11" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="sex">Sexo</Label>
                                        <Select name="sex" value={formData.sex} onValueChange={(v) => handleSelectChange("sex", v)}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Masculino</SelectItem>
                                                <SelectItem value="F">Feminino</SelectItem>
                                                <SelectItem value="other">Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Address */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Fields on top, map below */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2 md:col-span-1 relative">
                                    <Label htmlFor="zipCode" className="text-sm font-semibold">CEP</Label>
                                    <div className="relative">
                                        <Input id="zipCode" name="zipCode" placeholder="00000-000" value={formData.zipCode} onChange={handleChange} required className="h-12 rounded-xl pr-10" />
                                        {loadingCEP && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />}
                                    </div>
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="street" className="text-sm font-semibold">Logradouro</Label>
                                    <Input id="street" name="street" placeholder="Rua, Avenida..." value={formData.street} onChange={handleChange} required className="h-12 rounded-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="grid gap-2 md:col-span-1">
                                    <Label htmlFor="number" className="text-sm font-semibold">Número</Label>
                                    <Input id="number" name="number" placeholder="123" value={formData.number}
                                        onChange={handleChange}
                                        onBlur={(e) => {
                                            if (e.target.value && formData.street && formData.city) {
                                                geocodeAddress(`${formData.street}, ${e.target.value}, ${formData.city}, Brasil`);
                                            }
                                        }}
                                        required className="h-12 rounded-xl" />
                                </div>
                                <div className="grid gap-2 md:col-span-3">
                                    <Label htmlFor="complement" className="text-sm font-semibold">Complemento</Label>
                                    <Input id="complement" name="complement" placeholder="Apt, Sala, Bloco..." value={formData.complement} onChange={handleChange} className="h-12 rounded-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="grid gap-2 md:col-span-5">
                                    <Label htmlFor="neighborhood" className="text-sm font-semibold">Bairro</Label>
                                    <Input id="neighborhood" name="neighborhood" placeholder="Bairro" value={formData.neighborhood} onChange={handleChange} required className="h-12 rounded-xl" />
                                </div>
                                <div className="grid gap-2 md:col-span-4">
                                    <Label htmlFor="city" className="text-sm font-semibold">Cidade</Label>
                                    <Input id="city" name="city" placeholder="Cidade" value={formData.city} onChange={handleChange} required className="h-12 rounded-xl" />
                                </div>
                                <div className="grid gap-2 md:col-span-3">
                                    <Label htmlFor="state" className="text-sm font-semibold">UF</Label>
                                    <Select name="state" value={formData.state} onValueChange={(v) => handleSelectChange("state", v)}>
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="UF" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BRAZILIAN_STATES.map((st) => (
                                                <SelectItem key={st.value} value={st.value}>{st.value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Live Map */}
                            <AddressMap
                                latitude={mapCoords?.lat}
                                longitude={mapCoords?.lng}
                                onCoordinatesChange={(lat, lng) => setMapCoords({ lat, lng })}
                            />

                            {/* Hidden fields */}
                            <input type="hidden" name="email" value={formData.email} />
                            <input type="hidden" name="password" value={formData.password} />
                            <input type="hidden" name="name" value={formData.name} />
                            <input type="hidden" name="cpf" value={formData.cpf} />
                            <input type="hidden" name="phone" value={formData.phone} />
                            <input type="hidden" name="crm" value={formData.crm} />
                            <input type="hidden" name="crmState" value={formData.crmState} />
                            <input type="hidden" name="birthDate" value={formData.birthDate} />
                            <input type="hidden" name="sex" value={formData.sex} />
                            {formData.specialtyIds.map(id => (
                                <input key={id} type="hidden" name="specialtyIds" value={id} />
                            ))}
                            {mapCoords && <input type="hidden" name="latitude" value={mapCoords.lat} />}
                            {mapCoords && <input type="hidden" name="longitude" value={mapCoords.lng} />}
                        </div>
                    )}

                    {state?.error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl font-medium animate-in zoom-in-95 duration-200">
                            {state.error}
                        </div>
                    )}

                    {state?.success && (
                        <div className="bg-green-500/10 text-green-600 text-sm p-4 rounded-xl font-medium flex items-center gap-2">
                            <Check size={18} /> Conta criada com sucesso! Redirecionando...
                        </div>
                    )}

                    {!state?.success && (
                        <div className="flex gap-4 pt-2">
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-12 rounded-xl transition-all active:scale-95" disabled={isPending}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                            )}

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 transition-all active:scale-95"
                                    disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                                >
                                    Próximo <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20" disabled={isPending}>
                                    {isPending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                                            Criando conta...
                                        </div>
                                    ) : "Finalizar Cadastro"}
                                </Button>
                            )}
                        </div>
                    )}
                </form>
            </CardContent>

            <CardFooter className="pb-8 flex flex-col space-y-4">
                <div className="text-sm text-muted-foreground text-center w-full">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                        Fazer login
                    </Link>
                </div>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed px-10">
                    Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade.
                </p>
            </CardFooter>
        </Card>
    );
}

const AddressMap = dynamic(
    () => import("@/components/maps/SimpleMap").then((m) => m.SimpleMap),
    { ssr: false, loading: () => <div className="h-[220px] animate-pulse bg-muted rounded-xl" /> }
);

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] bg-[radial-gradient(#e9ecef_1px,transparent_1px)] [background-size:20px_20px] p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            }>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
