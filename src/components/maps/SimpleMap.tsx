"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import Map, { Marker } from "react-map-gl/mapbox";

interface SimpleMapProps {
    latitude?: number | null;
    longitude?: number | null;
    onCoordinatesChange: (lat: number, lng: number) => void;
    placeholderTitle?: string;
    placeholderDescription?: string;
    height?: string;
}

export function SimpleMap({
    latitude,
    longitude,
    onCoordinatesChange,
    placeholderTitle = "Localização no Mapa",
    placeholderDescription = "Preencha o CEP para carregar o mapa.",
    height = "300px"
}: SimpleMapProps) {
    if (!latitude || !longitude) {
        return (
            <div
                className="flex flex-col items-center justify-center bg-muted/30 border border-dashed rounded-xl text-center space-y-3 p-8"
                style={{ minHeight: height }}
            >
                <MapPin className="h-10 w-10 text-muted-foreground/50" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/70">{placeholderTitle}</p>
                    <p className="text-xs text-muted-foreground">{placeholderDescription}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full overflow-hidden rounded-xl border shadow-sm"
            style={{ height }}
        >
            <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                style={{ height: "100%", width: "100%" }}
                initialViewState={{
                    latitude,
                    longitude,
                    zoom: 15.5,
                }}
                key={`${latitude}-${longitude}`}
                onClick={(event) => {
                    if (event.type === "click") {
                        const { lng, lat } = event.lngLat;
                        onCoordinatesChange(lat, lng);
                    }
                }}
            >
                <Marker
                    longitude={longitude}
                    latitude={latitude}
                    anchor="bottom"
                    draggable
                    onDragEnd={(e) => {
                        onCoordinatesChange(e.lngLat.lat, e.lngLat.lng);
                    }}
                >
                    <MapPin className="size-8 text-primary drop-shadow-md" fill="currentColor" />
                </Marker>
            </Map>
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-xs border text-foreground/70">
                Arraste o pino para ajustar a localização
            </div>
        </div>
    );
}
