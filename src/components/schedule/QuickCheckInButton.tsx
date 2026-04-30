"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    getCheckInDialogDataAction,
    type CheckInDialogDataPayload,
} from "@/app/actions/check-ins";
import { AddCheckInDialog } from "@/components/check-ins/AddCheckInDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuickCheckInAppointmentStatus =
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "done"
    | "cancelled"
    | "no_show";

export type QuickCheckInButtonProps = {
    status: QuickCheckInAppointmentStatus | string;
    patientId: string;
    doctorId: string;
    serviceTypeId: string | null;
    /** true quando já existe um check-in para este agendamento */
    hasCheckIn?: boolean;
    /** icon: só ícone (cards compactos); inline: texto curto; full: largura total */
    variant?: "icon" | "inline" | "full";
    className?: string;
};

export function QuickCheckInButton({
    status,
    patientId,
    doctorId,
    serviceTypeId,
    hasCheckIn = false,
    variant = "icon",
    className,
}: QuickCheckInButtonProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogData, setDialogData] = useState<CheckInDialogDataPayload | null>(null);
    const [loading, setLoading] = useState(false);

    // Já tem check-in: exibe ícone verde desabilitado
    if (hasCheckIn) {
        const doneClass =
            variant === "icon"
                ? "size-7 shrink-0 p-0 text-green-700 cursor-default"
                : variant === "full"
                  ? "w-full justify-center gap-2 text-green-700"
                  : "h-8 gap-1.5 px-2.5 text-xs shrink-0 text-green-700 cursor-default";
        return (
            <Button
                type="button"
                variant={variant === "icon" ? "ghost" : "outline"}
                size={variant === "full" ? "default" : "sm"}
                className={cn(doneClass, className)}
                title="Check-in já realizado"
                disabled
            >
                <CheckCircle2 className="size-3.5 text-green-700" />
                {variant === "inline" ? <span>Check-in</span> : null}
                {variant === "full" ? <span>Check-in realizado</span> : null}
            </Button>
        );
    }

    if (status !== "scheduled" && status !== "confirmed") {
        return null;
    }

    if (!patientId || !doctorId) {
        return null;
    }

    async function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        try {
            const result = await getCheckInDialogDataAction();
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            setDialogData(result.data);
            setDialogOpen(true);
        } catch {
            toast.error("Erro ao carregar dados do check-in");
        } finally {
            setLoading(false);
        }
    }

    const triggerClass =
        variant === "icon"
            ? "size-7 shrink-0 cursor-pointer p-0 text-muted-foreground hover:text-primary"
            : variant === "full"
              ? "w-full cursor-pointer justify-center gap-2"
              : "h-8 cursor-pointer gap-1.5 px-2.5 text-xs shrink-0";

    return (
        <>
            <Button
                type="button"
                variant={variant === "icon" ? "ghost" : "outline"}
                size={variant === "full" ? "default" : "sm"}
                className={cn(triggerClass, className)}
                title="Fazer check-in (dados do agendamento)"
                disabled={loading}
                onClick={handleClick}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <ClipboardCheck className="size-3.5" />
                )}
                {variant === "inline" ? <span>Check-in</span> : null}
                {variant === "full" ? <span>Fazer check-in</span> : null}
            </Button>

            {dialogData ? (
                <AddCheckInDialog
                    patients={dialogData.patients}
                    serviceTypes={dialogData.serviceTypes}
                    healthInsurances={dialogData.healthInsurances}
                    doctors={dialogData.doctors}
                    open={dialogOpen}
                    onOpenChange={(next) => {
                        setDialogOpen(next);
                        if (!next) {
                            setDialogData(null);
                        }
                    }}
                    initialValues={{
                        patientId,
                        doctorId,
                        serviceTypeId: serviceTypeId ?? "",
                    }}
                    dialogTitle="Check-in"
                    dialogDescription="Dados preenchidos a partir do agendamento. Confira o convênio e as observações antes de salvar."
                />
            ) : null}
        </>
    );
}
