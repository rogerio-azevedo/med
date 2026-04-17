"use client";

import { PageHeader } from "@/components/shared/PageHeader";

interface DashboardLayoutHeaderProps {
    title: string;
    /** Texto antes do sufixo de saudação (ex.: "Visão geral da clínica"). */
    description: string;
    userName?: string | null;
    /** Se true, usa "Olá, Dr. {primeiro nome}". */
    doctorGreeting?: boolean;
}

export function DashboardLayoutHeader({
    title,
    description,
    userName,
    doctorGreeting,
}: DashboardLayoutHeaderProps) {
    const first = userName?.trim().split(/\s+/).filter(Boolean)[0] ?? "";
    const suffix =
        first !== ""
            ? doctorGreeting
                ? ` • Olá, Dr. ${first}`
                : ` • Olá, ${first}`
            : "";

    return <PageHeader title={title} description={`${description}${suffix}`} />;
}
