"use client";

import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createScheduleBlockAction } from "@/app/actions/appointments";
import {
    scheduleBlockReasonValues,
    scheduleBlockReasonLabels,
} from "@/lib/validations/schedule-blocks";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

type Doctor = { id: string; name: string | null };

interface DoctorScheduleBlockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctors: Doctor[];
    defaultDoctorId?: string;
}

export function DoctorScheduleBlockModal({
    open,
    onOpenChange,
    doctors,
    defaultDoctorId,
}: DoctorScheduleBlockModalProps) {
    const [isPending, startTransition] = useTransition();

    const [doctorId, setDoctorId] = useState(defaultDoctorId ?? "");
    const [reason, setReason] =
        useState<(typeof scheduleBlockReasonValues)[number]>("personal");
    const [note, setNote] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");

    const isValid = doctorId && reason && startsAt && endsAt;

    function handleSubmit() {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("doctorId", doctorId);
            formData.set("reason", reason);
            if (note) formData.set("note", note);
            // Convert local datetime to ISO
            formData.set("startsAt", new Date(startsAt).toISOString());
            formData.set("endsAt", new Date(endsAt).toISOString());

            const result = await createScheduleBlockAction(formData);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Bloqueio de agenda criado!");
                onOpenChange(false);
                resetForm();
            }
        });
    }

    function resetForm() {
        setDoctorId(defaultDoctorId ?? "");
        setReason("personal");
        setNote("");
        setStartsAt("");
        setEndsAt("");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="size-4 text-muted-foreground" />
                        <DialogTitle>Bloquear Agenda</DialogTitle>
                    </div>
                    <DialogDescription>
                        Bloqueie um período na agenda do médico por indisponibilidade.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Médico */}
                    {doctors.length > 1 && (
                        <div className="space-y-1.5">
                            <Label>Médico *</Label>
                            <Select value={doctorId} onValueChange={setDoctorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o médico..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Motivo */}
                    <div className="space-y-1.5">
                        <Label>Motivo *</Label>
                        <Select
                            value={reason}
                            onValueChange={(v) =>
                                setReason(v as (typeof scheduleBlockReasonValues)[number])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {scheduleBlockReasonValues.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {scheduleBlockReasonLabels[r]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Período */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Início *</Label>
                            <input
                                type="datetime-local"
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Fim *</Label>
                            <input
                                type="datetime-local"
                                value={endsAt}
                                min={startsAt}
                                onChange={(e) => setEndsAt(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Nota opcional */}
                    <div className="space-y-1.5">
                        <Label>Observação <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Textarea
                            placeholder="Ex: Congresso de cardiologia em São Paulo..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!isValid || isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Bloquear Agenda"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
