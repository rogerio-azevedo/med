import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuCheckboxItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Filter, Calendar as CalendarIcon } from "lucide-react";

interface TimelineFiltersProps {
    onFilterChange: (filters: any) => void;
}

export function TimelineFilters({ onFilterChange }: TimelineFiltersProps) {
    return (
        <div className="flex gap-2">
            {/* Filtro por Tipo */}
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
                    <DropdownMenuCheckboxItem checked>Consultas</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Retornos</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Exames</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Procedimentos</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Outros</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtro por Período */}
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

            {/* Tags Ativas (Exemplos) */}
            <div className="ml-2 flex flex-wrap items-center gap-2">
                <Badge
                    variant="secondary"
                    className="gap-1 border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                >
                    Todos os tipos
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
