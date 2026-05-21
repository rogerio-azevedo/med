"use client";

import { useCallback, useEffect, useMemo, useState, type WheelEvent, type TouchEvent } from "react";
import type { ReactNode } from "react";
import Select from "react-select";
import type { GroupBase, MenuListProps, OnChangeValue, OptionProps, StylesConfig } from "react-select";
import { components as RSComponents } from "react-select";
import { Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { useReactSelectInModal } from "@/hooks/use-react-select-in-modal";
import { searchMedicationsAction } from "@/app/actions/prescriptions";
import { mapCatalogRouteToPrescriptionRoute } from "@/lib/prescription-route-map";

type MedicationSearchRow = {
    id: string;
    name: string;
    activeIngredient: string;
    concentration: string | null;
    pharmaceuticalForm: string;
    route: string | null;
};

/** Opção vinda da busca no catálogo (campo extra `row` para o menu). */
type CatalogMedicationOption = {
    value: string;
    label: string;
    row: MedicationSearchRow;
};

export type MedicationPickResult = {
    medicationId: string;
    medicineName: string;
    pharmaceuticalForm: string;
    dosageHint: string | null;
    route: ReturnType<typeof mapCatalogRouteToPrescriptionRoute>;
};

type MedicationSearchProps = {
    value: string;
    onChangeName: (name: string) => void;
    onSelectMedication: (picked: MedicationPickResult) => void;
    onClearMedicationId: () => void;
    selectedMedicationId: string | null;
    /** Linha auxiliar no aviso (forma, dosagem, etc.), preenchida a partir do formulário. */
    catalogDraftSecondaryLine?: string;
    /** Em edição o item já está na prescrição; o aviso de &quot;rascunho&quot; não se aplica. */
    formMode?: "add" | "edit";
    /** Conteúdo à direita do campo de busca (ex.: flag), na mesma linha do input a partir de `sm`. */
    inputRowEnd?: ReactNode;
};

function MenuListStopWheel(
    props: MenuListProps<CatalogMedicationOption, false, GroupBase<CatalogMedicationOption>>,
) {
    const { innerProps, ...rest } = props;
    return (
        <RSComponents.MenuList
            {...rest}
            innerProps={{
                ...(innerProps ?? {}),
                onWheel: (e: WheelEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    innerProps?.onWheel?.(e);
                },
                onTouchMove: (e: TouchEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    innerProps?.onTouchMove?.(e);
                },
            }}
        />
    );
}

function CatalogOptionInner(
    props: OptionProps<CatalogMedicationOption, false, GroupBase<CatalogMedicationOption>>,
) {
    const { data } = props;
    const row = data.row;
    return (
        <RSComponents.Option {...props}>
            <div className="flex flex-col items-start gap-0.5 py-0.5 text-left">
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                    {row.pharmaceuticalForm}
                    {row.concentration ? ` · ${row.concentration}` : ""}
                    {row.activeIngredient ? ` · ${row.activeIngredient}` : ""}
                </span>
            </div>
        </RSComponents.Option>
    );
}

export function MedicationSearch({
    value,
    onChangeName,
    onSelectMedication,
    onClearMedicationId,
    selectedMedicationId,
    catalogDraftSecondaryLine,
    formMode = "add",
    inputRowEnd,
}: MedicationSearchProps) {
    const [options, setOptions] = useState<CatalogMedicationOption[]>([]);
    const [loading, setLoading] = useState(false);
    const debounced = useDebounce(value, 300);

    const { styles: hookStyles, selectProps: selectPropsFromHook } = useReactSelectInModal({ maxMenuHeight: 420 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- opções já filtradas no servidor; prefixo igual à Agenda (`rs`)
    const { filterOption, className: _hookClassName, classNamePrefix: _hookPrefix, ...selectProps } = selectPropsFromHook;
    void _hookClassName;
    void _hookPrefix;

    const styles = useMemo<StylesConfig<CatalogMedicationOption, false, GroupBase<CatalogMedicationOption>>>(
        () => ({
            ...hookStyles,
            control: (base, state) => {
                const b = hookStyles.control
                    ? (hookStyles.control as (a: typeof base, s: typeof state) => typeof base)(base, state)
                    : base;
                return {
                    ...b,
                    minHeight: "40px",
                    borderRadius: "0.375rem",
                };
            },
        }),
        [hookStyles],
    );

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (debounced.trim().length < 2) {
                setOptions([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await searchMedicationsAction(debounced);
                if (cancelled) return;
                if (res.success) {
                    const rows = res.items as MedicationSearchRow[];
                    setOptions(
                        rows.map((row) => ({
                            value: row.id,
                            label: row.name,
                            row,
                        })),
                    );
                } else {
                    setOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [debounced]);

    /** Só mostra “chip” quando veio do catálogo; texto livre aparece só no input (`inputValue`). */
    const selectValue = useMemo((): CatalogMedicationOption | null => {
        if (!selectedMedicationId) return null;
        const v = value.trim();
        return {
            value: selectedMedicationId,
            label: v || "—",
            row: {
                id: selectedMedicationId,
                name: v,
                activeIngredient: "",
                concentration: null,
                pharmaceuticalForm: "",
                route: null,
            } satisfies MedicationSearchRow,
        };
    }, [value, selectedMedicationId]);

    const handleChange = useCallback(
        (newValue: OnChangeValue<CatalogMedicationOption, false>) => {
            if (!newValue) {
                onChangeName("");
                onClearMedicationId();
                return;
            }
            const fromList = options.find((o) => o.value === newValue.value);
            const row = fromList?.row ?? newValue.row;
            const dosageHint = row.concentration?.trim() || null;
            onSelectMedication({
                medicationId: row.id,
                medicineName: row.name,
                pharmaceuticalForm: row.pharmaceuticalForm,
                dosageHint,
                route: mapCatalogRouteToPrescriptionRoute(row.route),
            });
        },
        [onChangeName, onClearMedicationId, onSelectMedication, options],
    );

    const selectComponents = useMemo(
        () => ({
            MenuList: MenuListStopWheel,
            Option: CatalogOptionInner,
            LoadingIndicator: () => <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />,
        }),
        [],
    );

    return (
        <div className="w-full space-y-1.5">
            <label className="text-sm font-medium" htmlFor="medication-search-select">
                Medicamento
            </label>
            <div
                className={
                    inputRowEnd
                        ? "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                        : "block"
                }
            >
                <div className="min-w-0 flex-1">
                    <Select<CatalogMedicationOption, false, GroupBase<CatalogMedicationOption>>
                        {...selectProps}
                        inputId="medication-search-select"
                        instanceId="medication-search-select"
                        className="w-full"
                        classNamePrefix="rs"
                        isClearable
                        isSearchable
                        blurInputOnSelect
                        placeholder="Buscar na base ou digite livremente (ex.: manipulado)…"
                        noOptionsMessage={({ inputValue }) =>
                            (inputValue?.trim().length ?? 0) < 2
                                ? "Digite pelo menos 2 caracteres para buscar no catálogo."
                                : "Nenhum resultado na base. Você pode continuar digitando (ex.: manipulado)."
                        }
                        loadingMessage={() => "Buscando…"}
                        isLoading={loading}
                        filterOption={null}
                        options={options}
                        value={selectValue}
                        onChange={handleChange}
                        inputValue={value}
                        onInputChange={(v, meta) => {
                            if (meta.action === "input-change") {
                                onChangeName(v);
                                if (selectedMedicationId) onClearMedicationId();
                            }
                        }}
                        components={selectComponents}
                        styles={styles}
                    />
                </div>
                {inputRowEnd ? <div className="w-full shrink-0 sm:w-[30%] sm:min-w-44 sm:max-w-xs">{inputRowEnd}</div> : null}
            </div>
            {selectedMedicationId && formMode === "add" ? (
                <div
                    role="status"
                    className="flex gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-left"
                >
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-medium">
                                Rascunho do catálogo
                            </Badge>
                            <span className="text-xs text-muted-foreground">Ainda não está na prescrição</span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-foreground">{value.trim() || "—"}</p>
                        {catalogDraftSecondaryLine?.trim() ? (
                            <p className="text-xs text-muted-foreground">{catalogDraftSecondaryLine.trim()}</p>
                        ) : null}
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Complete os campos abaixo e clique em <strong className="text-foreground">Salvar na prescrição</strong>{" "}
                            para incluir este medicamento na lista.
                        </p>
                    </div>
                </div>
            ) : null}
            {selectedMedicationId && formMode === "edit" ? (
                <div className="flex gap-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/70" aria-hidden />
                    <span>
                        Dados carregados do <strong className="text-foreground">catálogo da clínica</strong>. Altere os
                        campos se precisar e use <strong className="text-foreground">Atualizar na prescrição</strong>.
                    </span>
                </div>
            ) : null}
        </div>
    );
}
