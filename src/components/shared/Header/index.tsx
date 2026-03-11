"use client";

import { signOutAction } from "@/app/actions/auth-client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useHeaderStore } from "@/store/header";

export function Header() {
    const { title, description } = useHeaderStore();

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 shrink-0 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                {title && (
                    <div className="ml-2 pr-4 border-l pl-4 border-border/50">
                        <h2 className="text-sm font-semibold md:text-lg">{title}</h2>
                        {description && <p className="text-xs text-muted-foreground hidden md:block">{description}</p>}
                    </div>
                )}
            </div>

            <form action={signOutAction}>
                <Button variant="outline" size="sm">
                    Sair
                </Button>
            </form>
        </header>
    );
}

