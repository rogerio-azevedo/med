"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";

export function ExamesPageHeader() {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useEffect(() => {
        setHeader("Gestão · Exames", "Registros de exames realizados na clínica.");

        return () => useHeaderStore.getState().clearHeader();
    }, [setHeader]);

    return null;
}
