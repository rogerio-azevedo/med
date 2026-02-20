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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, User, MapPin, Contact, Calendar, Check, Hospital } from "lucide-react";
import { createPatientAction } from "@/app/actions/patients";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import cep from "cep-promise";

const patientFormSchema = z.object({
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
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export function AddPatientDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [loadingCEP, setLoadingCEP] = useState(false);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: {
            name: "",
            email: "",
            cpf: "",
            phone: "",
            birthDate: "",
            sex: "M",
            zipCode: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
        },
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

    async function onSubmit(values: PatientFormValues) {
        setIsPending(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (value) formData.append(key, value);
        });

        try {
            const result = await createPatientAction(formData);
            if (result.success) {
                toast.success("Paciente cadastrado com sucesso!");
                setIsOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Erro ao cadastrar paciente");
            }
        } catch (error) {
            toast.error("Erro ao cadastrar paciente");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <User size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Novo Paciente</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                Cadastro manual para pacientes que necessitam de auxílio.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[80vh]">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
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
                                                        <Input type="date" {...field} className="h-11 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all pr-10" />
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
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        </form>
                    </Form>
                </ScrollArea>

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
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" /> Finalizar Cadastro</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
