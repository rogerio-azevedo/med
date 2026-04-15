"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
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
    const [results, setResults] = useState<MedicationSearchRow[]>([]);
    const [loading, setLoading] = useState(false);
    const debounced = useDebounce(value, 300);

    const search = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await searchMedicationsAction(term);
            if (res.success) {
                setResults(res.items as MedicationSearchRow[]);
            } else {
                setResults([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void search(debounced);
    }, [debounced, search]);

    return (
        <div className="w-full space-y-1.5">
            <label className="text-sm font-medium">Medicamento</label>
            <div
                className={
                    inputRowEnd
                        ? "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                        : "block"
                }
            >
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar na base ou digite livremente (ex.: manipulado)…"
                        value={value}
                        onChange={(e) => {
                            onChangeName(e.target.value);
                            if (selectedMedicationId) onClearMedicationId();
                        }}
                        className="pl-10"
                        autoComplete="off"
                    />
                    {loading ? (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : null}
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

            {results.length > 0 && debounced.trim().length >= 2 ? (
                <div className="mt-1 max-h-56 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                    <ScrollArea className="max-h-56">
                        {results.map((row) => (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => {
                                    const dosageHint = row.concentration?.trim() || null;
                                    onSelectMedication({
                                        medicationId: row.id,
                                        medicineName: row.name,
                                        pharmaceuticalForm: row.pharmaceuticalForm,
                                        dosageHint,
                                        route: mapCatalogRouteToPrescriptionRoute(row.route),
                                    });
                                    setResults([]);
                                }}
                                className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2.5 text-left text-sm last:border-0 hover:bg-muted"
                            >
                                <span className="font-medium text-foreground">{row.name}</span>
                                <span className="line-clamp-2 text-xs text-muted-foreground">
                                    {row.pharmaceuticalForm}
                                    {row.concentration ? ` · ${row.concentration}` : ""}
                                    {row.activeIngredient ? ` · ${row.activeIngredient}` : ""}
                                </span>
                            </button>
                        ))}
                    </ScrollArea>
                </div>
            ) : null}
        </div>
    );
}
