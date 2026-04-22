"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface DoctorsFiltersProps {
    initialValues: {
        q: string;
        hideUnassociated: boolean;
    };
}

export function DoctorsFilters({ initialValues }: DoctorsFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(initialValues.q);
    const [hideUnassociated, setHideUnassociated] = useState(initialValues.hideUnassociated);

    function pushWithFilters(next: { q: string; hideUnassociated: boolean }) {
        const params = new URLSearchParams(searchParams.toString());

        if (next.q.trim()) {
            params.set("q", next.q.trim());
        } else {
            params.delete("q");
        }

        if (next.hideUnassociated) {
            params.delete("hideUnassociated");
        } else {
            params.set("hideUnassociated", "false");
        }

        params.set("page", "1");

        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    function applySearch() {
        pushWithFilters({ q: query, hideUnassociated });
    }

    return (
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            applySearch();
                        }
                    }}
                    placeholder="Buscar médico por nome..."
                    className="pl-9"
                />
            </div>

            <label className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                <Checkbox
                    checked={hideUnassociated}
                    onCheckedChange={(checked) => {
                        const nextHide = checked === true;
                        setHideUnassociated(nextHide);
                        pushWithFilters({ q: query, hideUnassociated: nextHide });
                    }}
                />
                <span className="font-medium">Ocultar médicos sem vínculo</span>
            </label>

            <Button type="button" variant="secondary" className="w-full shrink-0 lg:w-auto" onClick={applySearch}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
            </Button>
        </div>
    );
}
