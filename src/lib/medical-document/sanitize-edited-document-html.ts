import DOMPurify from "isomorphic-dompurify";

/** Tags compatíveis com o corpo do documento médico e com exportação típica do Lexical. */
const ALLOWED_TAGS = [
    "p",
    "div",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "span",
] as const;

/**
 * Remove scripts/event handlers e restringe tags antes de persistir `edited_content`
 * ou comparar com o render canônico.
 */
export function sanitizeEditedDocumentHtml(html: string): string {
    const trimmed = html.trim();
    if (!trimmed) return "";
    return DOMPurify.sanitize(trimmed, {
        ALLOWED_TAGS: [...ALLOWED_TAGS],
        ALLOWED_ATTR: ["class", "dir", "lang"],
    });
}
