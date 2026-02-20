"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
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

const doctorFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    specialtyIds: z.array(z.string()).min(1, "Selecione pelo menos uma especialidade"),
    practiceAreaIds: z.array(z.string()).optional(),
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

export function AddDoctorDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [practiceAreas, setPracticeAreas] = useState<{ value: string; label: string }[]>([]);

    const form = useForm<DoctorFormValues>({
        resolver: zodResolver(doctorFormSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            crm: "",
            crmState: "",
            specialtyIds: [],
            practiceAreaIds: [],
        },
    });

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
        }
    }, [isOpen]);

    async function onSubmit(values: DoctorFormValues) {
        setIsPending(true);
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if (key === "specialtyIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("specialtyIds", id));
            } else if (key === "practiceAreaIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("practiceAreaIds", id));
            } else if (value) {
                formData.append(key, value as string);
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
        } catch (error) {
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
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Cadastrar Médico</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Adicione um novo profissional à sua equipe.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                        <div className="space-y-4">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Lock size={12} className="text-muted-foreground" />
                                                Senha Temporária
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Mínimo 6 chars" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-2">
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
                                                placeholder="Selecione as especialidades..."
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
                                    <FormItem>
                                        <FormLabel>Áreas de Atuação</FormLabel>
                                        <FormControl>
                                            <ReactSelect
                                                isMulti
                                                placeholder="Selecione as áreas de atuação..."
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
                        </div>

                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-[11px] text-primary/70 font-medium leading-relaxed">
                                <span className="font-bold underline italic">Nota:</span> O médico receberá um email (se configurado) solicitando a alteração da senha no primeiro acesso.
                            </p>
                        </div>
                    </form>
                </Form>

                <DialogFooter className="p-6 bg-muted/20 border-t flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="hover:bg-muted/50 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        onClick={form.handleSubmit(onSubmit)}
                        className="min-w-[160px] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95"
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" /> Concluir Cadastro</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
