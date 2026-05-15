"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
    $isListNode,
} from "@lexical/list";
import {
    $getSelection,
    $isRangeSelection,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    type ElementFormatType,
} from "lexical";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlignUi = "left" | "center" | "right";

function normalizeAlign(f: ElementFormatType): AlignUi {
    if (f === "center") return "center";
    if (f === "right" || f === "end") return "right";
    return "left";
}

function readToolbarState(): {
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    align: AlignUi;
    listType: null | "bullet" | "number";
} {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return {
            isBold: false,
            isItalic: false,
            isUnderline: false,
            align: "left",
            listType: null,
        };
    }

    const anchor = selection.anchor.getNode();
    const top = anchor.getTopLevelElementOrThrow();
    const align = normalizeAlign(top.getFormatType());

    let listType: null | "bullet" | "number" = null;
    let n: typeof anchor | null = anchor;
    while (n !== null) {
        if ($isListNode(n)) {
            const t = n.getListType();
            if (t === "bullet") listType = "bullet";
            else if (t === "number") listType = "number";
            break;
        }
        n = n.getParent();
    }

    return {
        isBold: selection.hasFormat("bold"),
        isItalic: selection.hasFormat("italic"),
        isUnderline: selection.hasFormat("underline"),
        align,
        listType,
    };
}

export type RichTextToolbarProps = {
    disabled?: boolean;
    className?: string;
};

export function RichTextToolbar({ disabled, className }: RichTextToolbarProps) {
    const [editor] = useLexicalComposerContext();
    const [state, setState] = useState(() => editor.getEditorState().read(readToolbarState));

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                setState(readToolbarState());
            });
        });
    }, [editor]);

    const run = useCallback(
        (fn: () => void) => {
            if (disabled) return;
            editor.update(fn);
        },
        [disabled, editor]
    );

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5",
                className
            )}
            role="toolbar"
            aria-label="Formatação do texto"
        >
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.isBold && "bg-muted")}
                aria-label="Negrito"
                title="Negrito"
                onClick={() =>
                    run(() => {
                        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                    })
                }
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.isItalic && "bg-muted")}
                aria-label="Itálico"
                title="Itálico"
                onClick={() =>
                    run(() => {
                        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                    })
                }
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.isUnderline && "bg-muted")}
                aria-label="Sublinhado"
                title="Sublinhado"
                onClick={() =>
                    run(() => {
                        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                    })
                }
            >
                <Underline className="h-4 w-4" />
            </Button>

            <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.align === "left" && "bg-muted")}
                aria-label="Alinhar à esquerda"
                title="Alinhar à esquerda"
                onClick={() =>
                    run(() => {
                        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
                    })
                }
            >
                <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.align === "center" && "bg-muted")}
                aria-label="Centralizar"
                title="Centralizar"
                onClick={() =>
                    run(() => {
                        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
                    })
                }
            >
                <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.align === "right" && "bg-muted")}
                aria-label="Alinhar à direita"
                title="Alinhar à direita"
                onClick={() =>
                    run(() => {
                        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
                    })
                }
            >
                <AlignRight className="h-4 w-4" />
            </Button>

            <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.listType === "bullet" && "bg-muted")}
                aria-label="Lista com marcadores"
                title="Lista com marcadores"
                onClick={() => {
                    if (disabled) return;
                    editor.update(() => {
                        const s = readToolbarState();
                        if (s.listType === "bullet") {
                            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                        } else {
                            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                        }
                    });
                }}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn("h-8 w-8 shrink-0 p-0", state.listType === "number" && "bg-muted")}
                aria-label="Lista numerada"
                title="Lista numerada"
                onClick={() => {
                    if (disabled) return;
                    editor.update(() => {
                        const s = readToolbarState();
                        if (s.listType === "number") {
                            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                        } else {
                            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                        }
                    });
                }}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
        </div>
    );
}
