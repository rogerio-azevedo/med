"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { ListItemNode, ListNode, registerList } from "@lexical/list";
import {
    $createParagraphNode,
    $getRoot,
    LineBreakNode,
    ParagraphNode,
    TextNode,
    type EditorThemeClasses,
} from "lexical";
import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from "react";
import { RichTextToolbar } from "@/components/document-templates/_shared/RichTextToolbar";
import { prepareLexicalImportHtml } from "@/components/document-templates/_shared/prepareLexicalImportHtml";
import { LEXICAL_HTML_IMPORT_TAG } from "@/components/document-templates/_shared/lexicalHtmlImportTag";
import { cn } from "@/lib/utils";

const templateEditorTheme: EditorThemeClasses = {
    paragraph: "mb-2 text-[13px] leading-relaxed text-black last:mb-0",
    text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
    },
    list: {
        ul: "my-1 list-disc pl-6",
        ol: "my-1 list-decimal pl-6",
        listitem: "my-0.5 pl-1",
        nested: {
            listitem: "list-none",
        },
    },
};

function EditableSyncPlugin({ editable }: { editable: boolean }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.setEditable(editable);
    }, [editor, editable]);

    return null;
}

function ImportHtmlPlugin({
    html,
    lastEmittedRef,
}: {
    html: string;
    lastEmittedRef: MutableRefObject<string | null>;
}) {
    const [editor] = useLexicalComposerContext();

    useLayoutEffect(() => {
        if (html === lastEmittedRef.current) {
            lastEmittedRef.current = null;
            return;
        }

        editor.update(
            () => {
                const root = $getRoot();
                root.clear();
                const parser = new DOMParser();
                const dom = parser.parseFromString(prepareLexicalImportHtml(html), "text/html");
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
            },
            { tag: LEXICAL_HTML_IMPORT_TAG }
        );
    }, [editor, html, lastEmittedRef]);

    return null;
}

function ListRegistrationPlugin() {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return registerList(editor);
    }, [editor]);
    return null;
}

function OnChangeHtmlPlugin({
    onChange,
    lastEmittedRef,
}: {
    onChange: (html: string) => void;
    lastEmittedRef: MutableRefObject<string | null>;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState, tags }) => {
            if (tags.has(LEXICAL_HTML_IMPORT_TAG)) return;
            editorState.read(() => {
                const out = $generateHtmlFromNodes(editor, null);
                lastEmittedRef.current = out;
                onChange(out);
            });
        });
    }, [editor, onChange, lastEmittedRef]);

    return null;
}

export type TemplateBodyEditorProps = {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
};

export function TemplateBodyEditor({
    value,
    onChange,
    disabled,
    className,
    contentClassName,
}: TemplateBodyEditorProps) {
    const lastEmittedRef = useRef<string | null>(null);

    return (
        <div
            className={cn(
                "relative flex min-h-[400px] flex-col overflow-hidden rounded-md border border-input bg-white",
                className
            )}
        >
            <LexicalComposer
                initialConfig={{
                    namespace: "DocumentTemplateBody",
                    theme: templateEditorTheme,
                    editable: !disabled,
                    onError: (e) => {
                        console.error(e);
                    },
                    nodes: [HeadingNode, QuoteNode, ParagraphNode, TextNode, LineBreakNode, ListNode, ListItemNode],
                }}
            >
                <ImportHtmlPlugin html={value} lastEmittedRef={lastEmittedRef} />
                <EditableSyncPlugin editable={!disabled} />
                <ListRegistrationPlugin />
                <OnChangeHtmlPlugin onChange={onChange} lastEmittedRef={lastEmittedRef} />
                <RichTextToolbar disabled={disabled} />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className={cn(
                                "min-h-[360px] px-4 py-3 text-[13px] leading-relaxed text-black outline-none",
                                contentClassName
                            )}
                            aria-label="Corpo do documento"
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
