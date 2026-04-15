/**
 * Detecta se o tipo de atendimento deve usar o fluxo de cirurgia (formulário próprio, não SOAP).
 * Usa `workflow` como fonte principal; nome/slug servem de fallback para cadastros desalinhados.
 */
export function isSurgeryServiceType(
    st: { workflow?: string | null; slug?: string | null; name?: string | null } | null | undefined
): boolean {
    if (!st) return false;
    if (st.workflow === "surgery") return true;
    if (st.slug === "surgery") return true;
    const n = (st.name || "").toLowerCase();
    if (/\bcirurg/.test(n)) return true;
    return false;
}
