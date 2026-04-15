"use client";

import type { LucideIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PlanPlaceholderDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    Icon: LucideIcon;
    description?: string;
};

export function PlanPlaceholderDialog({
    open,
    onOpenChange,
    title,
    Icon,
    description = "Funcionalidade em desenvolvimento. Em breve você poderá usar este recurso aqui.",
}: PlanPlaceholderDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
