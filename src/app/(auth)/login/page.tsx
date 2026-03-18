"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    LockKeyhole,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { login } from "../../actions/auth";

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, null);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f8fafc_100%)]">
            <div className="landing-noise landing-grid absolute inset-0 opacity-70" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/80 to-transparent" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 sm:px-8 lg:px-12">
                <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
                    <section className="landing-fade-up hidden lg:block">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
                        >
                            <ArrowLeft className="size-4" />
                            Voltar para a landing
                        </Link>

                        <div className="mt-8 max-w-2xl">
                            <span className="landing-chip inline-flex items-center gap-2 rounded-full border border-blue-200/70 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-blue-700 uppercase">
                                <ShieldCheck className="size-4" />
                                Acesso seguro
                            </span>

                            <h1 className="landing-heading mt-6 text-5xl font-semibold tracking-tight text-slate-950">
                                Entre no <span className="text-blue-600">med</span> e acompanhe sua operação com mais clareza.
                            </h1>

                            <p className="landing-copy mt-6 max-w-xl text-lg leading-8 text-slate-600">
                                Uma experiência pensada para clínicas e consultórios que precisam de agilidade, contexto clínico e organização no mesmo ambiente.
                            </p>
                        </div>

                        <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
                            {[
                                "Agenda, pacientes e prontuário no mesmo fluxo",
                                "Visual moderno para a rotina clínica",
                                "Acesso rápido para quem já faz parte da operação",
                                "Experiência mais organizada para o time inteiro",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="landing-card flex items-center gap-3 rounded-[1.5rem] border border-white/70 px-4 py-4"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                        <Stethoscope className="size-4" />
                                    </div>
                                    <p className="text-sm font-medium leading-6 text-slate-700">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="landing-fade-up-delay flex justify-center lg:justify-end">
                        <Card className="landing-card w-full max-w-md rounded-[2rem] border-white/70 py-0 shadow-2xl shadow-slate-950/10">
                            <CardHeader className="px-8 pt-8 pb-0">
                                <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Voltar
                                    </Link>
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        med
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
                                        <LockKeyhole className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-semibold text-slate-950">
                                            Entrar
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-sm leading-6 text-slate-600">
                                            Acesse sua conta para continuar no sistema.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="px-8 py-8">
                                <form action={action} className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="voce@clinica.com.br"
                                            defaultValue={state?.email}
                                            required
                                            className="h-12 rounded-xl border-slate-200 bg-white/80 px-4 shadow-sm"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                            Senha
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                defaultValue={state?.password}
                                                required
                                                className="h-12 rounded-xl border-slate-200 bg-white/80 px-4 pr-12 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-500 transition-colors hover:text-slate-800"
                                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {state?.error && (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                            {state.error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="mt-2 h-12 w-full rounded-xl bg-slate-950 text-base shadow-lg shadow-slate-950/15 hover:bg-slate-800"
                                        disabled={isPending}
                                    >
                                        {isPending ? "Entrando..." : "Entrar no sistema"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </main>
    );
}
