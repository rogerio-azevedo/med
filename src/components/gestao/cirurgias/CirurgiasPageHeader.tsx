"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";

export function CirurgiasPageHeader() {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useEffect(() => {
        setHeader("Gestão · Cirurgias", "Cirurgias registradas no prontuário da clínica.");

        return () => useHeaderStore.getState().clearHeader();
    }, [setHeader]);

    return null;
}
