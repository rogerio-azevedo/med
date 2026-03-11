"use client";

import { Button } from "@/components/ui/button";
import { Plus, Settings2, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BoardSelector({ boards, activeBoardId, onNewBoard, onConfigFlow, onEditBoard, onDeleteBoard }: any) {
    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {boards.map((board: any) => (
                <div key={board.id} className="flex items-center">
                    <Button
                        variant={activeBoardId === board.id ? "default" : "secondary"}
                        size="sm"
                        asChild
                        className={cn(
                            "h-10 px-5 text-sm font-semibold transition-all shadow-sm",
                            activeBoardId === board.id
                                ? "shadow-primary/20 rounded-l-2xl rounded-r-none pr-3"
                                : "bg-muted/30 hover:bg-muted/50 border-none rounded-2xl"
                        )}
                    >
                        <Link href={`/tarefas?boardId=${board.id}`}>
                            {board.icon && <span className="mr-2 text-base">{board.icon}</span>}
                            {board.name}
                        </Link>
                    </Button>
                    
                    {activeBoardId === board.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    className="h-10 px-2 rounded-r-2xl rounded-l-none border-l border-primary-foreground/20"
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditBoard?.(board)}>
                                    <Edit2 className="size-4 mr-2" /> Editar Quadro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteBoard?.(board)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="size-4 mr-2" /> Excluir Quadro
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            ))}

            <div className="h-6 w-px bg-border mx-1" />

            <Button
                variant="outline"
                size="sm"
                onClick={onNewBoard}
                className="h-10 w-10 p-0 rounded-2xl border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                title="Novo quadro"
            >
                <Plus className="size-5" />
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={onConfigFlow}
                className="h-10 w-10 p-0 rounded-2xl text-muted-foreground hover:text-foreground"
                title="Configurar fluxos automáticos"
            >
                <Settings2 className="size-5" />
            </Button>
        </div>
    );
}
