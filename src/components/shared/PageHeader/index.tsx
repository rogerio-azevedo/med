"use client";

import { useEffect, type ReactNode } from "react";
import { useHeaderStore } from "@/store/header";

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    const setHeader = useHeaderStore((state) => state.setHeader);
    const setToolbar = useHeaderStore((state) => state.setToolbar);
    const clearHeader = useHeaderStore((state) => state.clearHeader);

    useEffect(() => {
        setHeader(title, description);
        setToolbar(actions ?? null);

        return () => clearHeader();
    }, [title, description, actions, setHeader, setToolbar, clearHeader]);

    return null;
}
