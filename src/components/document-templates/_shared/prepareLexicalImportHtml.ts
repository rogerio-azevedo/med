/**
 * Prepara HTML para `$generateNodesFromDOM`: conteúdo precisa estar dentro de
 * `.lexical-html-import` para o parser percorrer childNodes corretamente.
 * Texto sem tags (modelos legados) é escapado e envolvido em `<p>`.
 */
export function prepareLexicalImportHtml(raw: string): string {
    if (!raw.trim()) {
        return `<div class="lexical-html-import"><p></p></div>`;
    }

    const trimmed = raw.trim();
    const withBr = raw.replace(/\n/g, "<br/>");

    if (trimmed.startsWith("<")) {
        if (/^<p[\s>/]/i.test(trimmed)) {
            return `<div class="lexical-html-import">${withBr}</div>`;
        }
        return `<div class="lexical-html-import"><p>${withBr}</p></div>`;
    }

    const escaped = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const plainWithBr = escaped.replace(/\n/g, "<br/>");
    return `<div class="lexical-html-import"><p>${plainWithBr}</p></div>`;
}
