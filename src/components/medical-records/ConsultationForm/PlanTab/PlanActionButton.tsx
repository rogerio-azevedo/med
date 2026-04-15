"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanActionButtonProps = {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    active?: boolean;
};

export function PlanActionButton({
    label,
    icon: Icon,
    onClick,
    active = false,
}: PlanActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5 sm:py-2.5",
                active
                    ? "border-primary bg-primary shadow-sm"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
            )}
        >
            <Icon
                className={cn(
                    "h-5 w-5 shrink-0 transition-colors sm:h-5 sm:w-5",
                    active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-primary",
                )}
            />
            <span
                className={cn(
                    "text-center text-[11px] font-semibold leading-tight sm:text-xs",
                    active ? "text-primary-foreground" : "text-primary",
                )}
            >
                {label}
            </span>
        </button>
    );
}
