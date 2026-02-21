"use client";

import { clsx } from "clsx";
import { Maximize2, Minimize2, Move, X, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Select from "react-select";

export interface Filters {
    showClinics: boolean;
    showDoctors: boolean;
    specialtyIds: string[];
}

interface FilterPosition {
    x: number;
    y: number;
}

interface FilterPanelProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    specialties: { id: string; name: string }[];
    isLoading?: boolean;
}

export function FilterPanel({
    filters,
    onFiltersChange,
    specialties,
    isLoading,
}: FilterPanelProps) {
    const [filterPosition, setFilterPosition] = useState<FilterPosition>({
        x: 20,
        y: 20,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const filterRef = useRef<HTMLDivElement>(null);

    // Array of options for react-select
    const specialtyOptions = specialties.map((s) => ({ value: s.id, label: s.name }));

    // Drag and drop handlers
    function handleMouseDown(e: React.MouseEvent) {
        e.preventDefault();

        if (filterRef.current) {
            const rect = filterRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
            setIsDragging(true);
        }
    }

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                const maxX = window.innerWidth - (filterRef.current?.offsetWidth || 320);
                const maxY = window.innerHeight - (filterRef.current?.offsetHeight || 400);

                const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, maxX));
                const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, maxY));

                setFilterPosition({
                    x: newX,
                    y: newY,
                });
            }
        },
        [isDragging, dragOffset]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={filterRef}
            className={clsx(
                "filter-panel absolute z-10 w-full max-w-sm rounded-lg border border-border bg-card/95 shadow-md backdrop-blur",
                isDragging && "dragging cursor-grabbing",
                isMinimized
                    ? "h-12 overflow-hidden"
                    : "transition-[height] duration-300"
            )}
            style={{
                left: filterPosition.x,
                top: filterPosition.y,
            }}
        >
            {/* Top Bar */}
            <div className="flex h-12 items-center justify-between rounded-t-lg bg-primary px-3 text-primary-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    title="Arrastar"
                    className="h-8 w-8 cursor-grab p-0 hover:bg-primary/90 hover:text-primary-foreground"
                    onMouseDown={handleMouseDown}
                >
                    <Move className="h-4 w-4" />
                </Button>
                <div className="font-medium text-sm">Filtros</div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        title={isMinimized ? "Expandir" : "Minimizar"}
                        className="h-8 w-8 p-0 hover:bg-primary/90 hover:text-primary-foreground"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? (
                            <Maximize2 className="h-4 w-4" />
                        ) : (
                            <Minimize2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto p-4 text-foreground">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-clinics" className="cursor-pointer font-semibold">Exibir Clínicas</Label>
                        <Switch
                            id="show-clinics"
                            checked={filters.showClinics}
                            onCheckedChange={(v) => onFiltersChange({ ...filters, showClinics: v })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-doctors" className="cursor-pointer font-semibold">Exibir Médicos</Label>
                        <Switch
                            id="show-doctors"
                            checked={filters.showDoctors}
                            onCheckedChange={(v) => onFiltersChange({ ...filters, showDoctors: v })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-semibold">Especialidade (Médicos)</Label>
                        <Select
                            instanceId="specialties-select"
                            isMulti
                            options={specialtyOptions}
                            placeholder="Todas as especialidades"
                            noOptionsMessage={() => "Nenhuma especialidade... "}
                            className="text-sm"
                            classNamePrefix="react-select"
                            value={specialtyOptions.filter(o => filters.specialtyIds.includes(o.value))}
                            onChange={(selected) => {
                                onFiltersChange({
                                    ...filters,
                                    specialtyIds: selected ? selected.map(s => s.value) : []
                                });
                            }}
                        />
                    </div>

                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Atualizando mapa...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
