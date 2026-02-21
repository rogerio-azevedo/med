"use client";

import { generateInvite } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useActionState } from "react";

export function InviteGenerator({ clinicId, role, title }: { clinicId?: string, role: "admin" | "doctor" | "patient" | "global_doctor", title?: string }) {
    const [lastCode, setLastCode] = useState<string | null>(null);

    const generate = async () => {
        const formData = new FormData();
        if (clinicId) {
            formData.append("clinicId", clinicId);
        }
        formData.append("role", role === "global_doctor" ? "doctor" : role);

        const result = await generateInvite(formData);
        if (result.success && result.code) {
            setLastCode(result.code);
        }
    };

    const roleLabel = {
        admin: "Administrador da Clínica",
        doctor: "Médico",
        patient: "Paciente",
        global_doctor: "Médico (Global)",
    }[role];

    return (
        <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">{title || `Convite para ${roleLabel}`}</h3>

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
