import type { CSSProperties } from "react";

/** Converte #RRGGBB em rgba() para bordas e fundos da timeline. */
export function hexToRgba(hex: string, alpha: number): string | null {
    const h = hex.trim().replace("#", "");
    if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return null;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function isValidTimelineHex(hex: string | null | undefined): hex is string {
    return typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
}

/**
 * Estilos inline para o círculo do ícone e o badge do tipo, a partir da cor do cadastro.
 */
export function timelineVisualStylesFromHex(hex: string): {
    ringStyle: CSSProperties;
    typeBadgeStyle: CSSProperties;
} {
    const border = hexToRgba(hex, 0.55) ?? hex;
    const ringBg = hexToRgba(hex, 0.12) ?? hex;
    const badgeBg = hexToRgba(hex, 0.16) ?? hex;
    const badgeBorder = hexToRgba(hex, 0.35) ?? hex;

    return {
        ringStyle: {
            borderColor: border,
            backgroundColor: ringBg,
            color: hex,
        },
        typeBadgeStyle: {
            backgroundColor: badgeBg,
            borderColor: badgeBorder,
            color: hex,
            borderWidth: 1,
            borderStyle: "solid",
        },
    };
}
