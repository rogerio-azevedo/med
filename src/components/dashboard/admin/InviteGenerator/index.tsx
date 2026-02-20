"use client";

import { generateInvite } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useActionState } from "react";

export function InviteGenerator({ clinicId, role }: { clinicId: string, role: "admin" | "doctor" | "patient" }) {
    const [lastCode, setLastCode] = useState<string | null>(null);

    const generate = async () => {
        const formData = new FormData();
        formData.append("clinicId", clinicId);
        formData.append("role", role);

        const result = await generateInvite(formData);
        if (result.success && result.code) {
            setLastCode(result.code);
        }
    };

    const roleLabel = {
        admin: "Administrador da Clínica",
        doctor: "Médico",
        patient: "Paciente"
    }[role];

    return (
        <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Convite para {roleLabel}</h3>

            <div className="flex gap-2 items-center">
                <Button onClick={generate} size="sm" variant="outline">
                    Gerar Novo Link
                </Button>
            </div>
            {lastCode && (
                <div className="mt-2 bg-muted p-2 rounded text-sm break-all">
                    Link: {window.location.origin}/register?invite={lastCode}
                </div>
            )}
        </div>
    );
}
