import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Formata datas vindas do banco (date ou timestamp ISO) para exibição em receituário. */
export function formatPrescriptionDateBr(value: string | Date | null | undefined): string | null {
    if (value == null || value === "") return null;
    try {
        const d =
            typeof value === "string"
                ? parseISO(value.length <= 10 ? `${value}T12:00:00` : value)
                : value;
        if (!isValid(d)) return null;
        return format(d, "dd/MM/yyyy", { locale: ptBR });
    } catch {
        return null;
    }
}
