"use client";

import { createClinic } from "@/app/actions/clinics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

const initialState = {
    error: undefined as string | object | undefined,
};

export function ClinicForm() {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createClinic(formData);
        if (result?.error) {
            return { error: result.error };
        }
        return { error: undefined };
    }, initialState);

    return (
        <form action={formAction} className="flex gap-4 items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="name" className="text-sm font-medium">Nome da Clínica</label>
                <Input type="text" id="name" name="name" placeholder="Ex: Instituto da Tireóide" required />
                {state.error && typeof state.error === 'object' && 'name' in state.error && (
                    <span className="text-xs text-red-500">{(state.error as any).name?.[0]}</span>
                )}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="slug" className="text-sm font-medium">Slug (Opcional)</label>
                <Input type="text" id="slug" name="slug" placeholder="ex: instituto-tireoide" />
                {state.error && typeof state.error === 'object' && 'slug' in state.error && (
                    <span className="text-xs text-red-500">{(state.error as any).slug?.[0]}</span>
                )}
            </div>
            <Button type="submit" disabled={isPending}>
                {isPending ? "Criando..." : "Criar Clínica"}
            </Button>
            {state.error && typeof state.error === 'string' && (
                <p className="text-xs text-red-500">{state.error}</p>
            )}
        </form>
    );
}
