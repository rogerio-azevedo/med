"use client";

import { signOutAction } from "@/app/actions/auth-client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useHeaderStore } from "@/store/header";
import { cn } from "@/lib/utils";

export function Header() {
    const title = useHeaderStore((s) => s.title);
    const description = useHeaderStore((s) => s.description);
    const toolbar = useHeaderStore((s) => s.toolbar);
    const hasToolbar = toolbar != null;

    return (
        <header
            className={cn(
                "shrink-0 border-b bg-card transition-[width,height] ease-linear",
                hasToolbar
                    ? "flex flex-col"
                    : "flex h-16 items-center justify-between px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
            )}
        >
            <div
                className={cn(
                    "flex w-full shrink-0 items-center justify-between px-4",
                    hasToolbar
                        ? "h-14 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
                        : "h-full"
                )}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <SidebarTrigger className="-ml-1 shrink-0" />
                    {title && (
                        <div className="ml-2 min-w-0 border-l border-border/50 pl-4 pr-4">
                            <h2 className="truncate text-sm font-semibold md:text-lg">{title}</h2>
                            {description && (
                                <p className="hidden text-xs text-muted-foreground md:block">{description}</p>
                            )}
                        </div>
                    )}
                </div>

                <form action={signOutAction} className="shrink-0">
                    <Button variant="outline" size="sm">
                        Sair
                    </Button>
                </form>
            </div>

            {hasToolbar && (
                <div className="flex min-h-14 flex-wrap items-center gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 md:min-h-[3.75rem]">
                    {toolbar}
                </div>
            )}
        </header>
    );
}

