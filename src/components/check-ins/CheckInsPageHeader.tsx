"use client";

import { useLayoutEffect } from "react";
import { useHeaderStore } from "@/store/header";
import { AddCheckInDialog } from "./AddCheckInDialog";

export type CheckInsDialogData = {
    patients: { id: string; name: string }[];
    serviceTypes: { id: string; name: string; workflow: string }[];
    healthInsurances: { id: string; name: string }[];
    doctors: { id: string; name: string | null }[];
};

export function CheckInsPageHeader({
    title,
    description,
    dialogData,
}: {
    title: string;
    description: string;
    dialogData: CheckInsDialogData;
}) {
    const setHeader = useHeaderStore((s) => s.setHeader);
    const setToolbar = useHeaderStore((s) => s.setToolbar);
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    useLayoutEffect(() => {
        setHeader(title, description);
        setToolbar(
            <AddCheckInDialog
                patients={dialogData.patients}
                serviceTypes={dialogData.serviceTypes}
                healthInsurances={dialogData.healthInsurances}
                doctors={dialogData.doctors}
            />
        );
        return () => clearHeader();
    }, [
        title,
        description,
        setHeader,
        setToolbar,
        clearHeader,
        dialogData.patients,
        dialogData.serviceTypes,
        dialogData.healthInsurances,
        dialogData.doctors,
    ]);

    return null;
}
