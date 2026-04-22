import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DoctorsPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    searchParams: Record<string, string | undefined>;
}

function buildPageHref(
    searchParams: Record<string, string | undefined>,
    nextPage: number
) {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    params.set("page", String(nextPage));

    return `/doctors?${params.toString()}`;
}

export function DoctorsPagination({
    page,
    totalPages,
    total,
    pageSize,
    searchParams,
}: DoctorsPaginationProps) {
    if (total === 0) {
        return null;
    }

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col gap-3 border-t border-muted/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Exibindo <span className="font-medium text-foreground">{start}</span> a{" "}
                <span className="font-medium text-foreground">{end}</span> de{" "}
                <span className="font-medium text-foreground">{total}</span> médicos
            </p>

            <div className="flex items-center gap-2">
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    className="gap-1"
                >
                    <Link
                        href={buildPageHref(searchParams, Math.max(1, page - 1))}
                        aria-disabled={page <= 1}
                        tabIndex={page <= 1 ? -1 : 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Link>
                </Button>

                <div className="rounded-md border border-muted/20 bg-muted/20 px-3 py-1.5 text-sm font-medium">
                    Página {page} de {totalPages}
                </div>

                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    className="gap-1"
                >
                    <Link
                        href={buildPageHref(searchParams, Math.min(totalPages, page + 1))}
                        aria-disabled={page >= totalPages}
                        tabIndex={page >= totalPages ? -1 : 0}
                    >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
