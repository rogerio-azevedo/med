"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { useHeaderStore } from "@/store/header"
import { cn } from "@/lib/utils"

export function Header() {
  const title = useHeaderStore((s) => s.title)
  const description = useHeaderStore((s) => s.description)
  const toolbar = useHeaderStore((s) => s.toolbar)
  const hasSecondaryContent = Boolean(title || description || toolbar)

  return (
    <header
      className={cn(
        "shrink-0 border-b bg-card transition-[width,height] ease-linear",
        hasSecondaryContent
          ? "px-4 py-4"
          : "flex h-16 items-center px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
      )}
    >
      {hasSecondaryContent && (
        <div className="mx-auto flex max-w-400 items-start gap-4">
          <SidebarTrigger className="mt-1 -ml-1 shrink-0" />

          <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              {title ? (
                <h1 className="bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                  {description}
                </p>
              ) : null}
            </div>

            {toolbar ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {toolbar}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {!hasSecondaryContent && <SidebarTrigger className="-ml-1 shrink-0" />}
    </header>
  )
}
