import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Calendar as CalendarIcon } from "lucide-react";
import {
    type TimelineTypeFilter,
    defaultTimelineTypeFilter,
    timelineRowMatchesTypeFilter,
} from "./timeline-type-filter";

export type { TimelineTypeFilter };
export { defaultTimelineTypeFilter, timelineRowMatchesTypeFilter };

interface TimelineFiltersProps {
    filter: TimelineTypeFilter;
    onFilterChange: (next: TimelineTypeFilter) => void;
}

export function TimelineFilters({ filter, onFilterChange }: TimelineFiltersProps) {
    const patch = (partial: Partial<TimelineTypeFilter>) => {
        onFilterChange({ ...filter, ...partial });
    };

    const allTypesActive = Object.values(filter).every(Boolean);
    const typeSummary = allTypesActive
        ? "Todos os tipos"
        : [
              filter.consultation && "Consultas",
              filter.return && "Retornos",
              filter.exam && "Exames",
              filter.procedure && "Procedimentos",
              filter.other && "Outros",
              filter.surgery && "Cirurgias",
          ]
              .filter(Boolean)
              .join(", ") || "Nenhum tipo";

    return (
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 text-sm">
                        <Filter className="size-4 md:size-4.5" />
                        Tipos
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                        checked={filter.consultation}
                        onCheckedChange={(c) => patch({ consultation: !!c })}
                    >
                        Consultas
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={filter.return}
                        onCheckedChange={(c) => patch({ return: !!c })}
                    >
                        Retornos
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={filter.exam}
                        onCheckedChange={(c) => patch({ exam: !!c })}
                    >
                        Exames
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={filter.procedure}
                        onCheckedChange={(c) => patch({ procedure: !!c })}
                    >
                        Procedimentos
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={filter.other}
                        onCheckedChange={(c) => patch({ other: !!c })}
                    >
                        Outros
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={filter.surgery}
                        onCheckedChange={(c) => patch({ surgery: !!c })}
                    >
                        Cirurgias
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 text-sm">
                        <CalendarIcon className="size-4 md:size-4.5" />
                        Período
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filtrar por data</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>Últimos 7 dias</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Últimos 30 dias</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Últimos 3 meses</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Tudo</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-2 flex flex-wrap items-center gap-2">
                <Badge
                    variant="secondary"
                    className="gap-1 border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                >
                    {typeSummary}
                </Badge>
                <Badge
                    variant="secondary"
                    className="gap-1 border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                >
                    Histórico completo
                </Badge>
            </div>
        </div>
    );
}
