"use client";

import { useMemo, useState } from "react";
import { Search, Share2 } from "lucide-react";
import { InviteDialog } from "@/components/common/InviteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddPatientDialog } from "@/components/patients/AddPatientDialog";
import { PatientsTable } from "@/components/patients/PatientsTable";

interface Patient {
    id: string;
    name: string;
    cpf: string | null;
    email: string | null;
    phone: string | null;
}

interface PatientsContentProps {
    clinicId: string;
    patients: Patient[];
    doctors: { id: string; name: string | null; relationshipType: "linked" | "partner" }[];
}

export function PatientsContent({
    clinicId,
    patients,
    doctors,
}: PatientsContentProps) {
    const [search, setSearch] = useState("");

    const filteredPatients = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return patients;
        }

        return patients.filter((patient) =>
            patient.name.toLowerCase().includes(normalizedSearch)
        );
    }, [patients, search]);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar paciente por nome..."
                        className="pl-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <InviteDialog
                        clinicId={clinicId}
                        role="patient"
                        trigger={
                            <Button variant="outline">
                                <Share2 className="mr-2 h-4 w-4" />
                                Convidar Paciente
                            </Button>
                        }
                    />
                    <AddPatientDialog doctors={doctors} />
                </div>
            </div>

            <PatientsTable
                patients={filteredPatients}
                doctors={doctors}
                emptyMessage={
                    search.trim()
                        ? "Nenhum paciente encontrado para essa busca."
                        : "Nenhum paciente encontrado."
                }
            />
        </div>
    );
}
