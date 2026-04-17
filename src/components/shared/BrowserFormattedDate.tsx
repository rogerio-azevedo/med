"use client";

import { cn } from "@/lib/utils";

type Variant = "time" | "dateTime";

function formatInBrowser(value: Date | string | number, variant: Variant) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    const opts: Intl.DateTimeFormatOptions =
        variant === "time"
            ? { hour: "2-digit", minute: "2-digit" }
            : {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              };
    return new Intl.DateTimeFormat("pt-BR", opts).format(d);
}

/** Formata instante no fuso local do navegador (evita UTC no SSR em produção). */
export function BrowserFormattedDate({
    value,
    variant,
    className,
}: {
    value: Date | string | number;
    variant: Variant;
    className?: string;
}) {
    return (
        <span className={cn(variant === "time" && "tabular-nums", className)}>
            {formatInBrowser(value, variant)}
        </span>
    );
}
