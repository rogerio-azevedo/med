"use client";

import { useMemo, useCallback } from "react";
import type { StylesConfig, GroupBase } from "react-select";
import { accentInsensitiveSelectFilter } from "@/lib/search-normalize";

/**
 * Hook centralizado para usar react-select dentro de modais Radix UI (Dialog / Sheet).
 *
 * ## Por que esse hook existe
 *
 * O `DialogContent` do Radix usa `transform: translate(-50%, -50%)` para centralização,
 * o que cria um novo contexto de empilhamento. Descendentes com `position: fixed` passam
 * a ter o *containing block* no elemento com `transform`, não no viewport — quebrando o
 * posicionamento do dropdown do react-select.
 *
 * A solução correta é:
 *  1. `menuPortalTarget={document.body}` — renderiza o menu fora do contexto do Dialog.
 *  2. `menuPosition="fixed"` — posiciona o menu em relação ao viewport.
 *  3. `menuShouldBlockScroll={false}` — não bloquear wheel globalmente (bloquearia o scroll
 *     da própria lista portaled).
 *  4. `menuShouldScrollIntoView={false}` — impede react-select de tentar fazer scroll do
 *     contêiner pai (que é overflow-y-auto dentro do modal).
 *  5. Guards em `onPointerDownOutside` / `onInteractOutside` do `DialogContent` para que
 *     clicar em uma opção do menu não feche o modal.
 *
 * ## Uso
 *
 * ```tsx
 * const { selectProps, dialogProps, styles } = useReactSelectInModal();
 *
 * // No DialogContent:
 * <DialogContent {...dialogProps}>
 *
 * // Em cada ReactSelect:
 * <ReactSelect {...selectProps} styles={styles} ... />
 * ```
 */

export interface UseReactSelectInModalOptions {
  /** Altura máxima da lista de opções em px. Padrão: 260. */
  maxMenuHeight?: number;
}

export interface UseReactSelectInModalReturn {
  /**
   * Estilos padronizados para o react-select (tema, borda, zIndex).
   * Tipado como `StylesConfig<any, any, any>` para ser compatível com qualquer
   * combinação de Option/IsMulti/Group sem problemas de variância de tipos.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: StylesConfig<any, any, any>;
  /**
   * Props para espalhar em cada `<ReactSelect>`.
   * Inclui: `menuPortalTarget`, `menuPosition`, `menuShouldBlockScroll`,
   * `menuShouldScrollIntoView`, `filterOption`, `className`, `classNamePrefix`.
   */
  selectProps: {
    className: string;
    classNamePrefix: string;
    menuPortalTarget: HTMLElement | null;
    menuPosition: "fixed";
    menuShouldBlockScroll: boolean;
    menuShouldScrollIntoView: boolean;
    filterOption: typeof accentInsensitiveSelectFilter;
  };
  /**
   * Props para espalhar no `<DialogContent>`.
   * Impede que clicar no menu portal feche o modal.
   */
  dialogProps: {
    onPointerDownOutside: (e: { preventDefault: () => void; target: EventTarget | null }) => void;
    onInteractOutside: (e: { preventDefault: () => void; target: EventTarget | null }) => void;
  };
}

const PORTAL_SELECTORS = ".react-select__menu, .react-select__menu-portal";

export function useReactSelectInModal(
  options: UseReactSelectInModalOptions = {}
): UseReactSelectInModalReturn {
  const { maxMenuHeight = 260 } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = useMemo<StylesConfig<any, any, any>>(
    () => ({
      control: (base) => ({
        ...base,
        borderColor: "hsl(var(--border))",
        borderRadius: "0.5rem",
        padding: "2px",
        boxShadow: "none",
        "&:hover": { borderColor: "hsl(var(--border))" },
      }),
      menu: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        pointerEvents: "auto",
      }),
      menuList: (base) => ({
        ...base,
        maxHeight: `min(40vh, ${maxMenuHeight}px)`,
      }),
    }),
    [maxMenuHeight]
  );

  const selectProps = useMemo(
    () => ({
      className: "react-select-container",
      classNamePrefix: "react-select" as const,
      menuPortalTarget: typeof document !== "undefined" ? document.body : null,
      menuPosition: "fixed" as const,
      menuShouldBlockScroll: false,
      menuShouldScrollIntoView: false,
      filterOption: accentInsensitiveSelectFilter,
    }),
    []
  );

  const guardClose = useCallback(
    (e: { preventDefault: () => void; target: EventTarget | null }) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.(PORTAL_SELECTORS)) {
        e.preventDefault();
      }
    },
    []
  );

  const dialogProps = useMemo(
    () => ({
      onPointerDownOutside: guardClose,
      onInteractOutside: guardClose,
    }),
    [guardClose]
  );

  return { styles, selectProps, dialogProps };
}
