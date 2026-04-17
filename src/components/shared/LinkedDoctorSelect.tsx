"use client";

import Select from "react-select";
import { Label } from "@/components/ui/label";
import { accentInsensitiveSelectFilter } from "@/lib/search-normalize";
import { cn } from "@/lib/utils";

export type LinkedDoctorItem = { id: string; name: string | null };

type Option = { value: string; label: string };

const reactSelectStyles = {
    container: (base: Record<string, unknown>) => ({
        ...base,
        width: "100%",
    }),
    control: (base: Record<string, unknown>) => ({
        ...base,
        width: "100%",
        borderColor: "hsl(var(--border))",
        borderRadius: "0.5rem",
        padding: "2px",
        boxShadow: "none",
        "&:hover": { borderColor: "hsl(var(--border))" },
    }),
    menu: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 50,
    }),
};

export function LinkedDoctorSelect({
    doctors,
    value,
    onChange,
    isDisabled,
    className,
    label = "Médico",
    showRequiredMark = false,
    placeholder = "Selecione o médico...",
}: {
    doctors: LinkedDoctorItem[];
    value: string;
    onChange: (doctorId: string) => void;
    isDisabled?: boolean;
    className?: string;
    label?: string;
    showRequiredMark?: boolean;
    placeholder?: string;
}) {
    const doctorOptions: Option[] = doctors.map((d) => ({
        value: d.id,
        label: d.name?.trim() ? `Dr(a). ${d.name}` : "Médico sem nome",
    }));

    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-sm font-medium">
                {label}
                {showRequiredMark ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Select
                placeholder={placeholder}
                options={doctorOptions}
                value={doctorOptions.find((option) => option.value === value) ?? null}
                onChange={(option) => onChange(option?.value ?? "")}
                filterOption={accentInsensitiveSelectFilter}
                classNamePrefix="rs"
                styles={reactSelectStyles}
                isDisabled={Boolean(isDisabled) || doctors.length === 0}
            />
            {doctors.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                    Nenhum médico vinculado ativo nesta clínica (parceiros não aparecem aqui).
                </p>
            ) : null}
        </div>
    );
}
