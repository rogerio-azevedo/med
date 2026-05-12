import type { InferSelectModel } from "drizzle-orm";
import type { addresses } from "@/db/schema/clinics";

type AddressRow = InferSelectModel<typeof addresses>;

/**
 * Formata endereço da clínica em uma linha legível (receituário / rodapé).
 */
export function formatClinicAddressLine(addr: AddressRow | null | undefined): string | null {
    if (!addr) return null;
    const parts: string[] = [];
    const streetLine = [addr.street?.trim(), addr.number?.trim()].filter(Boolean).join(", ");
    if (streetLine) parts.push(streetLine);
    if (addr.complement?.trim()) parts.push(addr.complement.trim());
    if (addr.neighborhood?.trim()) parts.push(addr.neighborhood.trim());
    const cityLine = [addr.city?.trim(), addr.state?.trim()].filter(Boolean).join("/");
    if (cityLine) parts.push(cityLine);
    if (addr.zipCode?.trim()) parts.push(`CEP ${addr.zipCode.trim()}`);
    return parts.length > 0 ? parts.join(" — ") : null;
}

/**
 * Linhas do rodapé impresso (atestados): rua/número, bairro, cidade-UF CEP.
 */
export function formatClinicAddressFooterLines(addr: AddressRow | null | undefined): string[] {
    if (!addr) return [];
    const lines: string[] = [];
    const streetLine = [addr.street?.trim(), addr.number?.trim()].filter(Boolean).join(", ");
    if (streetLine) lines.push(streetLine);
    if (addr.neighborhood?.trim()) lines.push(addr.neighborhood.trim());
    const city = addr.city?.trim();
    const st = addr.state?.trim();
    const cep = addr.zipCode?.trim();
    const cityPart = [city, st].filter(Boolean).join("-");
    if (cityPart || cep) {
        const tail = cep ? `${cityPart}${cityPart ? " " : ""}CEP: ${cep}` : cityPart;
        if (tail) lines.push(tail);
    }
    return lines;
}

export function getClinicIssueCityFromAddress(addr: AddressRow | null | undefined): string | null {
    const c = addr?.city?.trim();
    return c && c.length > 0 ? c : null;
}
