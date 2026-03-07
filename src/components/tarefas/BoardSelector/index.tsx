"use client";

import { Button } from "@/components/ui/button";
import { Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BoardSelector({ boards, activeBoardId, onNewBoard, onConfigFlow }: any) {
    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {boards.map((board: any) => (
                <Button
                    key={board.id}
                    variant={activeBoardId === board.id ? "default" : "secondary"}
                    size="sm"
                    asChild
                    className={cn(
                        "h-10 rounded-2xl px-5 text-sm font-semibold transition-all shadow-sm",
                        activeBoardId === board.id
                            ? "shadow-primary/20"
                            : "bg-muted/30 hover:bg-muted/50 border-none"
                    )}
                >
                    <Link href={`/tarefas?boardId=${board.id}`}>
                        {board.icon && <span className="mr-2 text-base">{board.icon}</span>}
                        {board.name}
                    </Link>
                </Button>
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
