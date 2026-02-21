"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import cep from "cep-promise";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertAddressAction } from "@/app/actions/addresses";

// Dynamic import to avoid SSR issues with mapbox
const SimpleMap = dynamic(
    () => import("@/components/maps/SimpleMap").then((m) => m.SimpleMap),
    { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-xl" /> }
);

const addressSchema = z.object({
    entityType: z.enum(["clinic", "doctor"]),
    entityId: z.string().uuid(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export interface AddressFormProps {
    entityType: "clinic" | "doctor";
    entityId: string;
    initialData?: {
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
    layout?: "horizontal" | "vertical";
}

export function AddressForm({ entityType, entityId, initialData, layout = "horizontal" }: AddressFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);

    const { register, handleSubmit, setValue, watch } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            entityType,
            entityId,
            zipCode: initialData?.zipCode || "",
            street: initialData?.street || "",
            number: initialData?.number || "",
            complement: initialData?.complement || "",
            neighborhood: initialData?.neighborhood || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            latitude: initialData?.latitude ?? undefined,
            longitude: initialData?.longitude ?? undefined,
        },
    });

    const latitude = watch("latitude");
    const longitude = watch("longitude");

    const geocodeAddress = async (addressQuery: string) => {
        try {
            const res = await fetch(`/api/geocode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: addressQuery }),
            });
            if (res.ok) {
                const geoData = await res.json();
                if (geoData.items?.length > 0) {
                    const { lat, lng } = geoData.items[0].position;
                    setValue("latitude", lat);
                    setValue("longitude", lng);
                }
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
    };

    const handleCepBlur = async () => {
        const currentCep = watch("zipCode")?.replace(/\D/g, "");
        if (currentCep && currentCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const info = await cep(currentCep);
                setValue("street", info.street);
                setValue("neighborhood", info.neighborhood);
                setValue("city", info.city);
                setValue("state", info.state);

                // Auto-geocode so the map appears immediately
                const query = `${info.street}, ${info.neighborhood}, ${info.city}, ${info.state}, Brasil`;
                await geocodeAddress(query);

                toast.success("CEP encontrado!");
            } catch {
                toast.error("CEP não encontrado.");
            } finally {
                setIsFetchingCep(false);
            }
        }
    };

    const onSubmit = async (data: AddressFormData) => {
        setIsLoading(true);
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        const result = await upsertAddressAction(formData);
        setIsLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Endereço salvo com sucesso!");
        }
    };

    return (
        <div className={layout === "horizontal" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-6"}>
            {/* Left/Top: Form Fields */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="zipCode">CEP</Label>
                        <div className="relative">
                            <Input
                                id="zipCode"
                                placeholder="00000-000"
                                {...register("zipCode")}
                                onBlur={handleCepBlur}
                                maxLength={9}
                                className="h-11"
                            />
                            {isFetchingCep && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2">
                        <Label htmlFor="street">Rua/Avenida</Label>
                        <Input id="street" {...register("street")} className="h-11" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="number">Número</Label>
                        <Input
                            id="number"
                            {...register("number")}
                            className="h-11"
                            onBlur={(e) => {
                                const st = watch("street");
                                const city = watch("city");
                                if (st && city && e.target.value) {
                                    geocodeAddress(`${st}, ${e.target.value}, ${city}, Brasil`);
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input id="complement" {...register("complement")} className="h-11" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input id="neighborhood" {...register("neighborhood")} className="h-11" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" {...register("city")} className="h-11" />
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2">
                        <Label htmlFor="state">Estado (UF)</Label>
                        <Input
                            id="state"
                            placeholder="SP"
                            maxLength={2}
                            {...register("state")}
                            className="h-11 uppercase max-w-[100px]"
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={isLoading} className="hover:bg-primary/90 transition-all">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar Endereço
                    </Button>
                </div>
            </form>

            {/* Right: Live Map */}
            <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                    Preencha o CEP para o mapa atualizar automaticamente. Arraste o pino para ajustar a localização exata.
                </p>
                <div className="flex-1 min-h-[300px]">
                    <SimpleMap
                        latitude={latitude}
                        longitude={longitude}
                        onCoordinatesChange={(lat, lng) => {
                            setValue("latitude", lat);
                            setValue("longitude", lng);
                        }}
                        placeholderTitle="Mapa de Localização"
                        placeholderDescription="Preencha o CEP acima para exibir o mapa e confirmar a localização."
                        height="100%"
                    />
                </div>
            </div>
        </div>
    );
}
