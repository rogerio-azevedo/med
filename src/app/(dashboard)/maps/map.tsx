"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "./map-styles.css";

import { clsx } from "clsx";
import { Building2, Cross, Stethoscope } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import Map, { Marker, Popup, ViewState, MapRef } from "react-map-gl/mapbox";
import { FilterPanel, Filters } from "@/components/maps/FilterPanel";
import { renderPopupLayout } from "@/components/maps/popup-layout";

interface Location {
    latitude: number;
    longitude: number;
}

interface AddressPoint {
    id: string;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface ClinicMapItem {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: AddressPoint | null;
}

interface DoctorSpecialty {
    specialty: {
        id: string;
        name: string;
    };
}

interface DoctorMapItem {
    id: string;
    name: string | null;
    crm: string | null;
    crmState: string | null;
    address: AddressPoint | null;
    specialties: DoctorSpecialty[];
}

interface HospitalMapItem {
    id: string;
    name: string;
    description: string | null;
    address: AddressPoint | null;
}

interface SpecialtyOption {
    id: string;
    name: string;
}

interface MapComponentProps {
    clinics: ClinicMapItem[];
    doctors: DoctorMapItem[];
    hospitals: HospitalMapItem[];
    specialties: SpecialtyOption[];
}

interface PopupInfo {
    type: "clinic" | "doctor" | "hospital";
    data: ClinicMapItem | DoctorMapItem | HospitalMapItem;
    latitude: number;
    longitude: number;
}

export function MapComponent({ clinics, doctors, hospitals, specialties }: MapComponentProps) {
    const defaultLocation = {
        latitude: -23.5505,
        longitude: -46.6333, // SP default se nao achar nada
        zoom: 4
    };

    const firstPoint = clinics[0]?.address || doctors[0]?.address || hospitals[0]?.address;

    const [viewState, setViewState] = useState<ViewState>({
        latitude: firstPoint?.latitude || defaultLocation.latitude,
        longitude: firstPoint?.longitude || defaultLocation.longitude,
        zoom: firstPoint ? 12 : defaultLocation.zoom,
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
    const [filters, setFilters] = useState<Filters>({
        showClinics: true,
        showDoctors: true,
        showHospitals: true,
        specialtyIds: [],
    });

    const mapRef = useRef<MapRef>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    setUserLocation({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    });
                },
                (error) => {
                    console.error("Erro ao obter localização:", error);
                }
            );
        }
    }, []);

    function handleMarkerClick(
        type: "clinic" | "doctor" | "hospital",
        data: ClinicMapItem | DoctorMapItem | HospitalMapItem,
        latitude: number,
        longitude: number
    ) {
        setPopupInfo({ type, data, latitude, longitude });
        // Pan the map so the popup is fully visible — shift center upward to make room for the card above the marker
        mapRef.current?.flyTo({
            center: [longitude, latitude + 0.0015],
            zoom: Math.max((mapRef.current.getMap().getZoom()), 13),
            duration: 600,
            essential: true,
        });
    }

    const filteredDoctors = useMemo(() => {
        if (!filters.showDoctors) return [];
        if (filters.specialtyIds.length === 0) return doctors;
        return doctors.filter(doctor =>
            doctor.specialties?.some((specialty) => filters.specialtyIds.includes(specialty.specialty.id))
        );
    }, [filters, doctors]);

    const filteredClinics = filters.showClinics ? clinics : [];
    const filteredHospitals = filters.showHospitals ? hospitals : [];

    return (
        <div className="relative h-full w-full">
            <Map
                ref={mapRef}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                style={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "16px",
                    overflow: "hidden",
                }}
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
            >
                {/* Clínicas */}
                {filteredClinics.map((clinic) => {
                    if (clinic.address?.latitude && clinic.address?.longitude) {
                        const latitude = clinic.address.latitude;
                        const longitude = clinic.address.longitude;

                        return (
                            <Marker
                                key={clinic.id}
                                longitude={longitude}
                                latitude={latitude}
                                anchor="bottom"
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    handleMarkerClick("clinic", clinic, latitude, longitude);
                                }}
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute h-8 w-8 animate-ping rounded-full bg-green-400 opacity-50" />
                                    <Building2
                                        className={clsx(
                                            "size-10 cursor-pointer rounded-full p-2 bg-green-500 text-white shadow-md hover:scale-110 hover:bg-green-600 transition-transform",
                                            popupInfo?.type === "clinic" && popupInfo?.data?.id === clinic.id
                                                ? "scale-110 bg-green-600 ring-2 ring-white"
                                                : ""
                                        )}
                                    />
                                </div>
                            </Marker>
                        );
                    }
                    return null;
                })}

                {/* Médicos */}
                {filteredDoctors.map((doctor) => {
                    if (doctor.address?.latitude && doctor.address?.longitude) {
                        const latitude = doctor.address.latitude;
                        const longitude = doctor.address.longitude;

                        return (
                            <Marker
                                key={doctor.id}
                                longitude={longitude}
                                latitude={latitude}
                                anchor="bottom"
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    handleMarkerClick("doctor", doctor, latitude, longitude);
                                }}
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-50" />
                                    <Stethoscope
                                        className={clsx(
                                            "size-9 cursor-pointer rounded-full p-2 bg-blue-500 text-white shadow-md hover:scale-110 hover:bg-blue-600 transition-transform",
                                            popupInfo?.type === "doctor" && popupInfo?.data?.id === doctor.id
                                                ? "scale-110 bg-blue-600 ring-2 ring-white"
                                                : ""
                                        )}
                                    />
                                </div>
                            </Marker>
                        );
                    }
                    return null;
                })}

                {/* Hospitais */}
                {filteredHospitals.map((hospital) => {
                    if (hospital.address?.latitude && hospital.address?.longitude) {
                        const latitude = hospital.address.latitude;
                        const longitude = hospital.address.longitude;

                        return (
                            <Marker
                                key={hospital.id}
                                longitude={longitude}
                                latitude={latitude}
                                anchor="bottom"
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    handleMarkerClick("hospital", hospital, latitude, longitude);
                                }}
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute h-8 w-8 animate-ping rounded-full bg-rose-400 opacity-50" />
                                    <Cross
                                        className={clsx(
                                            "size-9 cursor-pointer rounded-full p-2 bg-rose-500 text-white shadow-md hover:scale-110 hover:bg-rose-600 transition-transform",
                                            popupInfo?.type === "hospital" && popupInfo?.data?.id === hospital.id
                                                ? "scale-110 bg-rose-600 ring-2 ring-white"
                                                : ""
                                        )}
                                    />
                                </div>
                            </Marker>
                        );
                    }
                    return null;
                })}

                {/* User Location Indicator */}
                {userLocation && (
                    <Marker
                        longitude={userLocation.longitude}
                        latitude={userLocation.latitude}
                        anchor="bottom"
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="absolute h-6 w-6 animate-ping rounded-full bg-indigo-400 opacity-50" />
                            <div className="relative h-4 w-4 rounded-full border-2 border-white bg-indigo-600 shadow-lg" />
                        </div>
                    </Marker>
                )}

                {/* Popup dispatcher */}
                {popupInfo && (
                    <Popup
                        longitude={popupInfo.longitude}
                        latitude={popupInfo.latitude}
                        anchor="bottom"
                        offset={[0, -35]}
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        closeOnClick={false}
                        className="z-50 min-w-[320px] popup-custom-style"
                        maxWidth="350px"
                    >
                        {renderPopupLayout({
                            type: popupInfo.type,
                            data: popupInfo.data,
                            onClose: () => setPopupInfo(null),
                        })}
                    </Popup>
                )}
            </Map>

            {/* Draggable Filter Component */}
            <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                specialties={specialties}
            />
        </div>
    );
}
