import sanitizeHtml from "sanitize-html";

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
 *
 * Usa `sanitize-html` (puro Node) em vez de DOMPurify+jsdom, para evitar falhas em
 * Server Actions / ambientes serverless onde o stack DOM pesado costuma quebrar.
 */
export function sanitizeEditedDocumentHtml(html: string): string {
    const trimmed = html.trim();
    if (!trimmed) return "";
    return sanitizeHtml(trimmed, {
        allowedTags: [...ALLOWED_TAGS],
        allowedAttributes: {
            "*": ["class", "dir", "lang"],
        },
        allowedSchemes: [],
        allowProtocolRelative: false,
        disallowedTagsMode: "discard",
    });
}
