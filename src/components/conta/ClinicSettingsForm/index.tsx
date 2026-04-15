"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Building2, Mail, Phone, FileText, FileStack } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddressForm, type AddressFormProps } from "@/components/shared/AddressForm";
import { updateClinicInfoAction } from "@/app/actions/clinics";
import { updateClinicSchema, type UpdateClinicInput } from "@/lib/validations/clinic";

interface ClinicSettingsFormProps {
    clinic: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        cnpj?: string | null;
        proposalGeneralNotes?: string | null;
    };
    address: AddressFormProps["initialData"];
}

export function ClinicSettingsForm({ clinic, address }: ClinicSettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<UpdateClinicInput>({
        resolver: zodResolver(updateClinicSchema),
        defaultValues: {
            name: clinic.name,
            email: clinic.email ?? "",
            phone: clinic.phone ?? "",
            cnpj: clinic.cnpj ?? "",
            proposalGeneralNotes: clinic.proposalGeneralNotes ?? "",
        },
    });

    const onSubmit = async (data: UpdateClinicInput) => {
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileStack className="h-5 w-5 text-primary" />
                            Observações gerais (PDF)
                        </CardTitle>
                        <CardDescription>
                            Condições gerais da clínica na impressão do orçamento (validade, internação, etc.).
                            A condição de pagamento (ex.: cartão 4x) vem de cada proposta, não daqui. Em branco
                            = texto padrão do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="proposalGeneralNotes">Conteúdo (opcional)</Label>
                            <Textarea
                                id="proposalGeneralNotes"
                                rows={6}
                                placeholder="Ex.: prazo de validade do orçamento, complicações, internação..."
                                className="min-h-[120px] resize-y text-sm"
                                {...register("proposalGeneralNotes")}
                            />
                            {errors.proposalGeneralNotes && (
                                <p className="text-xs text-destructive">{errors.proposalGeneralNotes.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading || !isDirty} className="min-w-[160px]">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar informações da clínica"
                        )}
                    </Button>
                </div>
            </form>

            <Separator className="my-2" />

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
