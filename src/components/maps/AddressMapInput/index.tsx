"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, MapPin } from "lucide-react";

import type { HereDiscoverApiResponseType, HereDiscoverItemType } from "@/app/api/geocode/route";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapLayout } from "./MapLayout";

export interface AddressData {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
}

interface AddressMapInputProps {
    onAddressSelect: (address: AddressData) => void;
}

export function AddressMapInput({ onAddressSelect }: AddressMapInputProps) {
    const [searchValue, setSearchValue] = useState("");
    const [addresses, setAddresses] = useState<HereDiscoverItemType[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<HereDiscoverItemType | null>(null);

    async function handleSearch() {
        if (searchValue.trim() === "") {
            toast.warning("Informe o endereço completo para buscar no mapa.");
            return;
        }

        try {
            setIsSearching(true);

            const response = await fetch(`/api/geocode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: searchValue }),
            });

            if (!response.ok) {
                throw new Error("Falha na busca de endereço");
            }

            const data: HereDiscoverApiResponseType = await response.json();

            if (data.items.length === 0) {
                toast.error("Não foi possível encontrar o endereço. Tente com mais detalhes (Ex: Rua, Cidade, Estado).");
            }

            setAddresses(data.items);
            setSelectedAddress(null);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar endereço.");
        } finally {
            setIsSearching(false);
        }
    }

    function handleConfirmPin(item: HereDiscoverItemType, lat: number, lng: number) {
        // Map the Here Api response to our Database schema fields
        const finalAddressData: AddressData = {
            street: item.address.street || "",
            number: item.address.houseNumber || "",
            neighborhood: item.address.district || "",
            city: item.address.city || "",
            state: item.address.state || "",
            zipCode: item.address.postalCode || "",
            latitude: lat,
            longitude: lng,
        };

        // Pass to parent
        onAddressSelect(finalAddressData);
        toast.success("Endereço e coordenadas gravadas com sucesso.");
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-end gap-2 w-full">
                <fieldset className="flex-1 space-y-1">
                    <Label htmlFor="search-address">Buscar Endereço no Mapa</Label>
                    <Input
                        id="search-address"
                        placeholder="Rua, número, bairro, cidade, estado..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch();
                            }
                        }}
                    />
                </fieldset>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    {isSearching ? "Buscando..." : "Buscar"}
                </Button>
            </div>

            {/* List possible addresses if multiple returned */}
            {addresses.length > 0 && !selectedAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-4">
                    {addresses.map((address) => (
                        <Card
                            key={address.id}
                            className="cursor-pointer transition-colors hover:border-primary border hover:bg-muted/50"
                            onClick={() => setSelectedAddress(address)}
                        >
                            <CardHeader className="p-4 space-y-1">
                                <CardTitle className="text-sm font-medium flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                    <span className="line-clamp-2">{address.title}</span>
                                </CardTitle>
                                <CardDescription className="text-xs line-clamp-2 pt-1">
                                    {address.address.city}, {address.address.state} - {address.address.postalCode}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                    <div className="col-span-full pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setAddresses([])}>
                            Limpar Busca
                        </Button>
                    </div>
                </div>
            )}

            {/* Render the Map with Draggable Pin if an address is selected */}
            {selectedAddress && (
                <div className="pt-2 rounded-lg border p-4 bg-card/50">
                    <MapLayout
                        selectedAddress={selectedAddress}
                        setSelectedAddress={() => {
                            setSelectedAddress(null);
                        }}
                        onConfirm={handleConfirmPin}
                    />
                </div>
            )}
        </div>
    );
}
