"use client";

import ReactSelect, { type StylesConfig } from "react-select";

export type SelectOption = { value: string; label: string };

interface FormSelectProps {
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    isClearable?: boolean;
    isDisabled?: boolean;
    inputId?: string;
    noOptionsMessage?: string;
}

export const BASE_SELECT_STYLES = {
    control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...base,
        borderRadius: "0.5rem",
        borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
        boxShadow: state.isFocused ? "0 0 0 2px color-mix(in oklch, var(--ring) 30%, transparent)" : "none",
        minHeight: "42px",
        fontSize: "0.875rem",
        backgroundColor: "var(--background)",
        "&:hover": { borderColor: "var(--border)" },
    }),
    menu: (base: Record<string, unknown>) => ({
        ...base,
        borderRadius: "0.5rem",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        zIndex: 50,
        fontSize: "0.875rem",
        backgroundColor: "var(--background)",
    }),
    menuList: (base: Record<string, unknown>) => ({
        ...base,
        padding: "4px",
        maxHeight: "240px",
    }),
    option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        padding: "8px 10px",
        cursor: "pointer",
        backgroundColor: state.isSelected
            ? "var(--primary)"
            : state.isFocused
              ? "var(--accent)"
              : "transparent",
        color: state.isSelected ? "var(--primary-foreground)" : "var(--foreground)",
        "&:active": { backgroundColor: "var(--accent)" },
    }),
    placeholder: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--muted-foreground)",
        fontSize: "0.875rem",
    }),
    indicatorSeparator: (base: Record<string, unknown>) => ({
        ...base,
        backgroundColor: "var(--border)",
    }),
    clearIndicator: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--muted-foreground)",
        padding: "0 6px",
        "&:hover": { color: "var(--foreground)" },
    }),
    dropdownIndicator: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--muted-foreground)",
        padding: "0 8px",
    }),
    input: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--foreground)",
        fontSize: "0.875rem",
    }),
    singleValue: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--foreground)",
        fontSize: "0.875rem",
    }),
    multiValue: (base: Record<string, unknown>) => ({
        ...base,
        backgroundColor: "var(--accent)",
        borderRadius: "0.375rem",
    }),
    multiValueLabel: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--foreground)",
        fontSize: "0.8rem",
    }),
    multiValueRemove: (base: Record<string, unknown>) => ({
        ...base,
        borderRadius: "0 0.375rem 0.375rem 0",
        "&:hover": { backgroundColor: "var(--destructive)", color: "var(--primary-foreground)" },
    }),
};

const buildStyles = (): StylesConfig<SelectOption, false> =>
    BASE_SELECT_STYLES as StylesConfig<SelectOption, false>;

export function FormSelect({
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    isClearable = false,
    isDisabled = false,
    inputId,
    noOptionsMessage = "Nenhuma opção encontrada",
}: FormSelectProps) {
    const selected = options.find((o) => o.value === value) ?? null;

    return (
        <ReactSelect<SelectOption, false>
            inputId={inputId}
            options={options}
            value={selected}
            onChange={(opt) => onChange(opt?.value ?? null)}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={isDisabled}
            noOptionsMessage={() => noOptionsMessage}
            styles={buildStyles()}
        />
    );
}
