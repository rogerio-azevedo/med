"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";

export function ConsultasPageHeader() {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useEffect(() => {
        setHeader("Gestão · Consultas", "Consultas registradas no prontuário da clínica.");

        return () => useHeaderStore.getState().clearHeader();
    }, [setHeader]);

    return null;
}
