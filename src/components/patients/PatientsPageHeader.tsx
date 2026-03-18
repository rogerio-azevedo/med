"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";

export function PatientsPageHeader() {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useEffect(() => {
        setHeader("Pacientes", "Gerencie o cadastro de seus pacientes.");

        return () => useHeaderStore.getState().clearHeader();
    }, [setHeader]);

    return null;
}
