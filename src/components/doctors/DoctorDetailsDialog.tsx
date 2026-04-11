"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DoctorProfile } from "./details/DoctorProfile";

interface DoctorDetailsDialogProps {
    doctor: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        crm: string | null;
        crmState: string | null;
        address: {
            street: string | null;
            number: string | null;
            complement: string | null;
            neighborhood: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            latitude: number | null;
            longitude: number | null;
        } | null;
        specialties: { id: string; name: string }[];
        practiceAreas: { id: string; name: string }[];
        healthInsurances: { id: string; name: string }[];
        observations: string | null;
    };
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DoctorDetailsDialog({
    doctor,
    isOpen,
    onOpenChange,
}: DoctorDetailsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 border-none shadow-2xl bg-white/95 backdrop-blur-md max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">
                        Detalhes do Profissional
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 font-medium">
                        Visualize todas as informações cadastradas de {doctor.name || "médico"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    <DoctorProfile doctor={doctor} hideHeader={true} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
