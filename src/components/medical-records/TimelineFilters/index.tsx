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
import { Filter, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";

interface TimelineFiltersProps {
    onFilterChange: (filters: any) => void;
}

export function TimelineFilters({ onFilterChange }: TimelineFiltersProps) {
    return (
        <div className="flex gap-2">
            {/* Filtro por Tipo */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
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
                    <Button variant="outline" size="sm" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
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
            <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className="gap-1 border-primary/20 text-primary bg-primary/5">
                    Todos os tipos
                </Badge>
                <Badge variant="secondary" className="gap-1 border-primary/20 text-primary bg-primary/5">
                    Histórico completo
                </Badge>
            </div>
        </div>
    );
}
