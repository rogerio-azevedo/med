"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InviteDialog } from "@/components/common/InviteDialog";
import { AddDoctorDialog } from "@/components/doctors/AddDoctorDialog";
import { DoctorsTable } from "@/components/doctors/DoctorsTable";

interface Doctor {
    id: string;
    name: string | null;
    crm: string | null;
    crmState: string | null;
    phone: string | null;
    email: string | null;
    inviteCode: string | null;
    relationshipType: "linked" | "partner" | null;
    isAssociated: boolean;
    specialties: { id: string; name: string }[];
    practiceAreas: { id: string; name: string }[];
    healthInsurances: { id: string; name: string }[];
    address?: {
        zipCode?: string | null;
        street?: string | null;
        number?: string | null;
        complement?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
    } | null;
}

interface DoctorsPageContentProps {
    clinicId: string;
    doctors: Doctor[];
}

export function DoctorsPageContent({ clinicId, doctors }: DoctorsPageContentProps) {
    const [hideUnassociatedDoctors, setHideUnassociatedDoctors] = useState(true);

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                    <Checkbox
                        checked={hideUnassociatedDoctors}
                        onCheckedChange={(checked) => setHideUnassociatedDoctors(checked === true)}
                    />
                    <span className="font-medium">Ocultar médicos sem vínculo</span>
                </label>

                <div className="flex items-center gap-2">
                    <InviteDialog
                        clinicId={clinicId}
                        role="doctor"
                        trigger={
                            <Button variant="outline">
                                <Share2 className="mr-2 h-4 w-4" />
                                Convidar Médico
                            </Button>
                        }
                    />
                    <AddDoctorDialog />
                </div>
            </div>

            <DoctorsTable
                doctors={doctors}
                hideUnassociatedDoctors={hideUnassociatedDoctors}
            />
        </div>
    );
}
