import { cn } from "@/lib/utils";
import { formatPrescriptionDateBr } from "@/lib/formatters/prescription-date";
import { PRESCRIPTION_ROUTE_LABELS, type PrescriptionRoute } from "@/lib/prescription-route-map";

export type PrescriptionItemDetailsInput = {
    medicineName: string;
    dosage?: string | null;
    pharmaceuticalForm?: string | null;
    frequency?: string | null;
    duration?: string | null;
    quantity?: string | null;
    route?: string | null;
    instructions?: string | null;
    isContinuous?: boolean | null;
    startDate?: string | null;
    endDate?: string | null;
};

function routeLabel(route: string | null | undefined) {
    if (!route) return null;
    return PRESCRIPTION_ROUTE_LABELS[route as PrescriptionRoute] ?? route;
}

export function prescriptionItemFieldRows(item: PrescriptionItemDetailsInput): { label: string; value: string }[] {
    const rows: { label: string; value: string }[] = [];
    if (item.dosage?.trim()) rows.push({ label: "Dosagem", value: item.dosage.trim() });
    if (item.pharmaceuticalForm?.trim()) rows.push({ label: "Forma farmacêutica", value: item.pharmaceuticalForm.trim() });
    const via = routeLabel(item.route);
    if (via) rows.push({ label: "Via", value: via });
    if (item.frequency?.trim()) rows.push({ label: "Frequência", value: item.frequency.trim() });
    if (item.duration?.trim()) rows.push({ label: "Duração", value: item.duration.trim() });
    if (item.quantity?.trim()) rows.push({ label: "Quantidade", value: item.quantity.trim() });
    const startBr = formatPrescriptionDateBr(item.startDate);
    if (startBr) rows.push({ label: "Início", value: startBr });
    const endBr = formatPrescriptionDateBr(item.endDate);
    if (endBr) rows.push({ label: "Fim", value: endBr });
    return rows;
}

/** Linha única para listas compactas (modal com vários itens). */
export function prescriptionItemSummaryParts(item: PrescriptionItemDetailsInput): string[] {
    const parts: string[] = [];
    if (item.dosage?.trim()) parts.push(item.dosage.trim());
    if (item.pharmaceuticalForm?.trim()) parts.push(item.pharmaceuticalForm.trim());
    const via = routeLabel(item.route);
    if (via) parts.push(via);
    if (item.frequency?.trim()) parts.push(item.frequency.trim());
    if (item.duration?.trim()) parts.push(item.duration.trim());
    if (item.quantity?.trim()) parts.push(item.quantity.trim());
    const startBr = formatPrescriptionDateBr(item.startDate);
    const endBr = formatPrescriptionDateBr(item.endDate);
    if (startBr && endBr) parts.push(`${startBr} → ${endBr}`);
    else if (startBr) parts.push(`início ${startBr}`);
    else if (endBr) parts.push(`fim ${endBr}`);
    if (item.isContinuous) parts.push("uso contínuo");
    return parts;
}

type PrescriptionItemDetailsProps = {
    item: PrescriptionItemDetailsInput;
    index?: number;
    className?: string;
    titleClassName?: string;
    /** Quando true, não renderiza o título com nome do medicamento (útil se o pai já exibiu). */
    omitMedicineTitle?: boolean;
    /**
     * `detailed`: grade com rótulos (prontuário, impressão rica).
     * `compact`: poucas linhas — melhor para vários medicamentos no mesmo modal.
     */
    variant?: "detailed" | "compact";
};

export function PrescriptionItemDetails({
    item,
    index,
    className,
    titleClassName,
    omitMedicineTitle = false,
    variant = "detailed",
}: PrescriptionItemDetailsProps) {
    const rows = prescriptionItemFieldRows(item);
    const showContinuous = item.isContinuous === true;
    const summary = prescriptionItemSummaryParts(item).filter((p) => p !== "uso contínuo");
    const instructionsTrim = item.instructions?.trim() ?? "";

    if (variant === "compact") {
        const summaryLine = summary.join(" · ");
        return (
            <div className={cn("min-w-0 space-y-0.5", className)}>
                <p
                    className={cn(
                        "text-sm font-semibold leading-snug text-foreground",
                        "line-clamp-2",
                        titleClassName
                    )}
                    title={item.medicineName}
                >
                    {index != null ? `${index}. ` : null}
                    {item.medicineName}
                </p>
                {summaryLine ? (
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground" title={summaryLine}>
                        {summaryLine}
                    </p>
                ) : null}
                {instructionsTrim ? (
                    <p
                        className="line-clamp-1 text-xs italic text-muted-foreground"
                        title={instructionsTrim}
                    >
                        Obs.: {instructionsTrim}
                    </p>
                ) : null}
                {showContinuous ? (
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Uso contínuo
                    </span>
                ) : null}
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {!omitMedicineTitle ? (
                <h4 className={cn("text-base font-semibold", titleClassName)}>
                    {index != null ? `${index}. ` : null}
                    {item.medicineName}
                </h4>
            ) : null}
            {rows.length > 0 ? (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="min-w-0">
                            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                            <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}
            {instructionsTrim ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Instruções ao paciente</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{instructionsTrim}</p>
                </div>
            ) : null}
            {showContinuous ? (
                <p className="text-xs font-semibold text-primary">Uso contínuo</p>
            ) : null}
        </div>
    );
}
