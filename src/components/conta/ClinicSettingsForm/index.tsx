"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Building2, Mail, Phone, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddressForm, type AddressFormProps } from "@/components/shared/AddressForm";
import { updateClinicInfoAction } from "@/app/actions/clinics";

const clinicInfoSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    cnpj: z.string().optional(),
});

type ClinicInfoFormData = z.infer<typeof clinicInfoSchema>;

interface ClinicSettingsFormProps {
    clinic: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        cnpj?: string | null;
    };
    address: AddressFormProps["initialData"];
}

export function ClinicSettingsForm({ clinic, address }: ClinicSettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ClinicInfoFormData>({
        resolver: zodResolver(clinicInfoSchema),
        defaultValues: {
            name: clinic.name,
            email: clinic.email ?? "",
            phone: clinic.phone ?? "",
            cnpj: clinic.cnpj ?? "",
        },
    });

    const onSubmit = async (data: ClinicInfoFormData) => {
        setIsLoading(true);
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        const result = await updateClinicInfoAction(formData);
        setIsLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Informações da clínica salvas com sucesso!");
        }
    };

    return (
        <div className="space-y-8">
            {/* Basic Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Informações da Clínica
                    </CardTitle>
                    <CardDescription>
                        Edite o nome, contato e dados cadastrais da sua clínica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <Label htmlFor="name">
                                    Nome da Clínica <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Clínica Tireoide"
                                    className="h-11"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email" className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    E-mail
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contato@clinica.com.br"
                                    className="h-11"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone" className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    Telefone
                                </Label>
                                <Input
                                    id="phone"
                                    placeholder="(65) 99999-9999"
                                    className="h-11"
                                    {...register("phone")}
                                />
                            </div>

                            {/* CNPJ */}
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <Label htmlFor="cnpj" className="flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    CNPJ
                                </Label>
                                <Input
                                    id="cnpj"
                                    placeholder="00.000.000/0001-00"
                                    className="h-11 max-w-xs"
                                    {...register("cnpj")}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isLoading || !isDirty}
                                className="min-w-[140px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    "Salvar Informações"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Endereço da Clínica</CardTitle>
                    <CardDescription>
                        Informe o endereço físico da clínica. Digite o CEP para preencher automaticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddressForm
                        entityType="clinic"
                        entityId={clinic.id}
                        initialData={address}
                        layout="horizontal"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
