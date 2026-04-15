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
                "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4",
                active
                    ? "border-primary bg-primary shadow-sm"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
            )}
        >
            <Icon
                className={cn(
                    "h-6 w-6 shrink-0 transition-colors sm:h-7 sm:w-7",
                    active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-primary",
                )}
            />
            <span
                className={cn(
                    "text-center text-xs font-semibold sm:text-sm",
                    active ? "text-primary-foreground" : "text-primary",
                )}
            >
                {label}
            </span>
        </button>
    );
}
