"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import { Button } from "@/components/ui/button";
import type { HereDiscoverItemType } from "@/app/api/geocode/route";

interface MapLayoutProps {
    selectedAddress: HereDiscoverItemType | null;
    setSelectedAddress: Dispatch<SetStateAction<HereDiscoverItemType[]>>;
    onConfirm: (address: HereDiscoverItemType, lat: number, lng: number) => void;
}

export function MapLayout({
    selectedAddress,
    setSelectedAddress,
    onConfirm,
}: MapLayoutProps) {
    const [loading, setLoading] = useState(false);

    const [coordinates, setCoordinates] = useState({
        latitude: selectedAddress?.position.lat ?? 0,
        longitude: selectedAddress?.position.lng ?? 0,
    });

    // If selectedAddress changes from parent, update map
    useEffect(() => {
        if (selectedAddress?.position) {
            setCoordinates({
                latitude: selectedAddress.position.lat,
                longitude: selectedAddress.position.lng,
            });
        }
    }, [selectedAddress]);

    async function handleConfirmAddress() {
        if (selectedAddress) {
            setLoading(true);
            try {
                // Pass back the finalized coordinates along with the address details
                onConfirm(selectedAddress, coordinates.latitude, coordinates.longitude);
                // Clear selected once confirmed
                setSelectedAddress([]);
            } finally {
                setLoading(false);
            }
        }
    }

    if (!selectedAddress) return null;

    return (
        <div className="flex h-full w-full flex-col gap-y-5 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col rounded-md bg-muted/50 p-3">
                <p className="text-sm font-medium">Endereço Selecionado:</p>
                <p className="text-sm text-muted-foreground mt-1">
                    {selectedAddress.address.street} {selectedAddress.address.houseNumber ? `, ${selectedAddress.address.houseNumber}` : ""}, {" "}
                    {selectedAddress.address.district ? `${selectedAddress.address.district}, ` : ""}
                    {selectedAddress.address.city} - {selectedAddress.address.state}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    * Arraste o mapa ou clique para ajustar a localização exata do pino, se necessário.
                </p>
            </div>

            <div className="relative h-[300px] w-full overflow-hidden rounded-lg border">
                <Map
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    style={{
                        height: "100%",
                        width: "100%",
                    }}
                    initialViewState={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        zoom: 15.5,
                    }}
                    onClick={(event) => {
                        if (event.type === "click") {
                            const { lng, lat } = event.lngLat;
                            setCoordinates({
                                latitude: lat,
                                longitude: lng,
                            });
                        }
                    }}
                >
                    <Marker
                        longitude={coordinates.longitude}
                        latitude={coordinates.latitude}
                        anchor="bottom"
                        draggable
                        onDragEnd={(e) => {
                            setCoordinates({
                                latitude: e.lngLat.lat,
                                longitude: e.lngLat.lng
                            });
                        }}
                    >
                        <MapPin className="size-8 text-primary drop-shadow-md" fill="currentColor" />
                    </Marker>
                </Map>
            </div>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedAddress([])}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    onClick={handleConfirmAddress}
                    disabled={loading}
                >
                    {loading ? "Confirmando..." : "Confirmar Localização"}
                </Button>
            </div>
        </div>
    );
}
