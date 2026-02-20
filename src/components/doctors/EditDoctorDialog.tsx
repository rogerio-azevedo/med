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
import { Loader2, Mail, Lock, Check, Pencil } from "lucide-react";
import { updateDoctorAction } from "@/app/actions/doctors";
import { getSpecialtiesAction } from "@/app/actions/specialties";
import { toast } from "sonner";
import ReactSelect from "react-select";

const doctorFormSchema = z.object({
    id: z.string(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    specialtyIds: z.array(z.string()).min(1, "Selecione pelo menos uma especialidade"),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

interface EditDoctorDialogProps {
    doctor: {
        id: string;
        name: string | null;
        email: string | null;
        crm: string | null;
        crmState: string | null;
        specialties: { id: string; name: string }[];
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditDoctorDialog({ doctor, isOpen, onOpenChange }: EditDoctorDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([]);

    const form = useForm<DoctorFormValues>({
        resolver: zodResolver(doctorFormSchema),
        defaultValues: {
            id: doctor.id,
            name: doctor.name || "",
            email: doctor.email || "",
            crm: doctor.crm || "",
            crmState: doctor.crmState || "",
            specialtyIds: [],
        },
    });

    useEffect(() => {
        if (isOpen) {
            getSpecialtiesAction().then((result) => {
                if (result.success && result.data) {
                    setSpecialties(result.data.map(s => ({ value: s.id, label: s.name })));
                }
            });
            form.reset({
                id: doctor.id,
                name: doctor.name || "",
                email: doctor.email || "",
                crm: doctor.crm || "",
                crmState: doctor.crmState || "",
                specialtyIds: doctor.specialties.map(s => s.id),
            });
        }
    }, [isOpen, doctor, form]);

    async function onSubmit(values: DoctorFormValues) {
        setIsPending(true);
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if (key === "specialtyIds" && Array.isArray(value)) {
                value.forEach(id => formData.append("specialtyIds", id));
            } else if (value) {
                formData.append(key, value as string);
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
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <Pencil size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Editar Médico</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Atualize as informações do profissional.
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
                                                styles={{
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
                                                }}
                                                value={specialties.filter(s => field.value?.includes(s.value))}
                                                onChange={(val) => field.onChange(val.map(v => v.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-[11px] text-primary/70 font-medium leading-relaxed italic">
                                Nota: A alteração do email afetará o login do médico.
                            </p>
                        </div>
                    </form>
                </Form>

                <DialogFooter className="p-6 bg-muted/20 border-t flex items-center justify-between sm:justify-between">
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
                        disabled={isPending}
                        onClick={form.handleSubmit(onSubmit)}
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
