"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";

export function DoctorsPageHeader() {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useEffect(() => {
        setHeader("Médicos", "Gerencie a equipe médica da sua clínica.");

        return () => useHeaderStore.getState().clearHeader();
    }, [setHeader]);

    return null;
}
