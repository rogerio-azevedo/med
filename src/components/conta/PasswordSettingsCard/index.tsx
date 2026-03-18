"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import { changeOwnPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordSettingsCard() {
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await changeOwnPasswordAction(formData);

            if (result?.error) {
                toast.error(result.error);
                return;
            }

            formRef.current?.reset();
            toast.success("Senha alterada com sucesso.");
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Acesso e Senha
                </CardTitle>
                <CardDescription>
                    Atualize sua senha de acesso. Depois dessa troca, use apenas a nova senha no login.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    ref={formRef}
                    action={handleSubmit}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                >
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <Label htmlFor="currentPassword">Senha atual</Label>
                        <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            placeholder="Digite sua senha atual"
                            className="h-11"
                            disabled={isPending}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="newPassword">Nova senha</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            placeholder="Mínimo de 6 caracteres"
                            className="h-11"
                            disabled={isPending}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Repita a nova senha"
                            className="h-11"
                            disabled={isPending}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex justify-end md:col-span-2">
                        <Button type="submit" disabled={isPending} className="min-w-[160px]">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Atualizar Senha"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
