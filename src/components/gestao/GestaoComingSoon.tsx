"use client";

import { useEffect } from "react";
import { useHeaderStore } from "@/store/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GestaoComingSoonProps {
    headerTitle: string;
    headerDescription: string;
    cardTitle: string;
    cardDescription: string;
}

export function GestaoComingSoon({
    headerTitle,
    headerDescription,
    cardTitle,
    cardDescription,
}: GestaoComingSoonProps) {
    const setHeader = useHeaderStore((state) => state.setHeader);

    useEffect(() => {
        setHeader(headerTitle, headerDescription);
        return () => useHeaderStore.getState().clearHeader();
    }, [setHeader, headerTitle, headerDescription]);

    return (
        <div className="p-8">
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle>{cardTitle}</CardTitle>
                    <CardDescription>{cardDescription}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Funcionalidade em planejamento. Em breve você poderá listar e filtrar por aqui.
                </CardContent>
            </Card>
        </div>
    );
}
