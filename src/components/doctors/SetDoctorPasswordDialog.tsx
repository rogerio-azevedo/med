"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import { setDoctorPasswordAction } from "@/app/actions/doctors";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetDoctorPasswordDialogProps {
    doctor: {
        id: string;
        name: string | null;
        email: string | null;
    } | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SetDoctorPasswordDialog({
    doctor,
    isOpen,
    onOpenChange,
}: SetDoctorPasswordDialogProps) {
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await setDoctorPasswordAction(formData);

            if (result?.error) {
                toast.error(result.error);
                return;
            }

            formRef.current?.reset();
            toast.success("Nova senha definida para o médico.");
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Definir senha do médico
                    </DialogTitle>
                    <DialogDescription>
                        Defina uma senha temporária para <span className="font-medium">{doctor?.name ?? "este médico"}</span>.
                        Depois, ele poderá entrar e trocar a senha em <span className="font-medium">Conta</span>.
                    </DialogDescription>
                </DialogHeader>

                <form ref={formRef} action={handleSubmit} className="space-y-5">
                    <input type="hidden" name="doctorId" value={doctor?.id ?? ""} />

                    <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                        <p className="font-medium">{doctor?.name ?? "-"}</p>
                        <p className="text-muted-foreground">{doctor?.email ?? "Sem e-mail informado"}</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password">Nova senha temporária</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Mínimo de 6 caracteres"
                            className="h-11"
                            disabled={isPending}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Repita a senha"
                            className="h-11"
                            disabled={isPending}
                            autoComplete="new-password"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || !doctor}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar nova senha"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
