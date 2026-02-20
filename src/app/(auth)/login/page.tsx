"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { login } from "../../actions/auth";

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, null);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Entre com seu email e senha para acessar o sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {state?.error && (
                            <div className="text-red-500 text-sm">{state.error}</div>
                        )}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="text-sm text-muted-foreground text-center w-full">
                        Não tem uma conta?{" "}
                        <Link href="/register" className="underline hover:text-primary">
                            Registre-se
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
