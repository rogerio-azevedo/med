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
