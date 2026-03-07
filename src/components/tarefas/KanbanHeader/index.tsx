"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, Search, Tag } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export function KanbanHeader({ onNewCard, onNewColumn, onManageCategories, filters, onFilterChange, categories, clinicUsers }: any) {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between py-2">
            <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar tarefas..."
                    value={filters.search}
                    onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto">
                <Select value={filters.priority} onValueChange={(v) => onFilterChange({ ...filters, priority: v })}>
                    <SelectTrigger className="w-[130px] shrink-0 h-9 bg-muted/30 border-none rounded-xl text-xs">
                        <Filter className="size-3 mr-2" />
                        <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas Prioridades</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="MEDIUM">Média</SelectItem>
                        <SelectItem value="LOW">Baixa</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filters.categoryId} onValueChange={(v) => onFilterChange({ ...filters, categoryId: v })}>
                    <SelectTrigger className="w-[130px] shrink-0 h-9 bg-muted/30 border-none rounded-xl text-xs">
                        <Tag className="size-3 mr-2" />
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas Categorias</SelectItem>
                        {categories?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.responsibleId} onValueChange={(v) => onFilterChange({ ...filters, responsibleId: v })}>
                    <SelectTrigger className="w-[130px] shrink-0 h-9 bg-muted/30 border-none rounded-xl text-xs">
                        <Filter className="size-3 mr-2" />
                        <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Responsáveis</SelectItem>
                        {clinicUsers?.map((cu: any) => (
                            <SelectItem key={cu.id} value={cu.id}>{cu.user?.name || cu.user?.email}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="h-6 w-px bg-border mx-1 hidden md:block" />

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onManageCategories}
                    className="h-9 gap-2 rounded-xl px-4 text-xs font-semibold"
                >
                    <Tag className="size-4" />
                    Categorias
                </Button>

                <div className="h-6 w-px bg-border mx-1 hidden md:block" />

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onNewColumn}
                    className="h-9 gap-2 rounded-xl px-4 text-xs font-semibold"
                >
                    <Plus className="size-4" />
                    Nova coluna
                </Button>

                <Button
                    size="sm"
                    onClick={onNewCard}
                    className="h-9 gap-2 rounded-xl px-4 text-xs font-semibold shadow-sm shadow-primary/20"
                >
                    <Plus className="size-4" />
                    Nova tarefa
                </Button>
            </div>
        </div>
    );
}
