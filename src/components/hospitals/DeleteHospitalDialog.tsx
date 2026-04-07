"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteHospitalAction } from "@/app/actions/hospitals";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteHospitalDialogProps {
    hospital: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteHospitalDialog({
    hospital,
    isOpen,
    onOpenChange,
}: DeleteHospitalDialogProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        try {
            const result = await deleteHospitalAction(hospital.id);

            if (result.success) {
                toast.success("Hospital removido com sucesso!");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Erro ao remover hospital");
            }
        } catch {
            toast.error("Erro ao remover hospital");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remover Hospital</DialogTitle>
                    <DialogDescription>
                        O hospital <span className="font-semibold">{hospital.name}</span> será inativado e deixará de aparecer nas listagens e no mapa.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
                        {isPending ? "Removendo..." : "Remover"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
