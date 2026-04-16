import type { FilterOptionOption } from "react-select";

const DIACRITIC_REGEX = /\p{M}+/gu;

/** Minúsculas e sem acentos, para comparação de busca (pt-BR). */
export function normalizeForSearch(value: string | null | undefined): string {
    return String(value ?? "")
        .normalize("NFD")
        .replace(DIACRITIC_REGEX, "")
        .toLowerCase();
}

/** Se `needle` vazio após trim, retorna true; senão, se o texto normalizado contém a busca. */
export function matchesNormalizedSearch(
    haystack: string | null | undefined,
    needle: string | null | undefined
): boolean {
    const n = normalizeForSearch((needle ?? "").trim());
    if (!n) return true;
    return normalizeForSearch(haystack).includes(n);
}

/** `filterOption` para react-select: ignora maiúsculas e acentos no rótulo. */
export function accentInsensitiveSelectFilter<Option>(
    option: FilterOptionOption<Option>,
    rawInput: string
): boolean {
    return matchesNormalizedSearch(String(option.label ?? ""), rawInput);
}
