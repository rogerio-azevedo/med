"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
    $createParagraphNode,
    $getRoot,
    FORMAT_TEXT_COMMAND,
    LineBreakNode,
    ParagraphNode,
    TextNode,
    type EditorThemeClasses,
} from "lexical";
import { useLayoutEffect, useEffect, type MutableRefObject } from "react";
import { Bold } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const docEditorTheme: EditorThemeClasses = {
    paragraph: "mb-2 text-left text-[13px] leading-relaxed text-black last:mb-0",
    text: {
        bold: "font-semibold",
    },
};

function prepareHtmlForImport(html: string) {
    if (!html.trim()) {
        return `<div class="lexical-html-import"><p></p></div>`;
    }
    const withBr = html.replace(/\n/g, "<br/>");
    const trimmed = html.trim();
    // $generateNodesFromDOM só percorre childNodes do container; texto solto no nível do div
    // não vira LexicalNode e some. Conteúdo dos modelos costuma ser inline + <strong>.
    // Se já vier como <p>… (reexport do Lexical), não duplicar.
    if (/^<p[\s>/]/i.test(trimmed)) {
        return `<div class="lexical-html-import">${withBr}</div>`;
    }
    return `<div class="lexical-html-import"><p>${withBr}</p></div>`;
}

function ImportHtmlPlugin({ html }: { html: string }) {
    const [editor] = useLexicalComposerContext();

    useLayoutEffect(() => {
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            const parser = new DOMParser();
            const dom = parser.parseFromString(prepareHtmlForImport(html), "text/html");
            const rootEl = dom.body.querySelector(".lexical-html-import");
            if (!rootEl) {
                root.append($createParagraphNode());
                return;
            }
            const nodes = $generateNodesFromDOM(editor, rootEl);
            if (nodes.length === 0) {
                root.append($createParagraphNode());
            } else {
                root.append(...nodes);
            }
        });
    }, [editor, html]);

    return null;
}

function ExportBridge({ bridgeRef }: { bridgeRef: MutableRefObject<{ getHtml: () => string } | null> }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        bridgeRef.current = {
            getHtml: () => {
                let out = "";
                editor.getEditorState().read(() => {
                    out = $generateHtmlFromNodes(editor, null);
                });
                return out;
            },
        };
        return () => {
            bridgeRef.current = null;
        };
    }, [bridgeRef, editor]);

    return null;
}

function BoldToolbarPlugin() {
    const [editor] = useLexicalComposerContext();

    return (
        <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                aria-label="Negrito"
                title="Negrito"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                }}
            >
                <Bold className="h-4 w-4" />
            </Button>
        </div>
    );
}

export type GeneratedDocumentBodyEditorProps = {
    /** HTML do corpo (mesmo formato usado em MedicalDocumentPrintShell). */
    html: string;
    bridgeRef: MutableRefObject<{ getHtml: () => string } | null>;
    className?: string;
};

export function GeneratedDocumentBodyEditor({ html, bridgeRef, className }: GeneratedDocumentBodyEditorProps) {
    return (
        <div className={cn("relative flex min-h-[280px] flex-col rounded-md border border-input bg-white", className)}>
            <LexicalComposer
                initialConfig={{
                    namespace: "GeneratedDocumentBody",
                    theme: docEditorTheme,
                    editable: true,
                    onError: (e) => {
                        console.error(e);
                    },
                    nodes: [HeadingNode, QuoteNode, ParagraphNode, TextNode, LineBreakNode],
                }}
            >
                <ImportHtmlPlugin html={html} />
                <ExportBridge bridgeRef={bridgeRef} />
                <BoldToolbarPlugin />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="min-h-[260px] px-4 py-3 text-[13px] leading-relaxed text-black outline-none"
                            aria-label="Editar corpo do documento"
                        />
                    }
                    placeholder={null}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
            </LexicalComposer>
        </div>
    );
}
