"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProposalStatsProps {
    stats: {
        status: string;
        count: number;
        totalValue: number;
    }[];
}

export function ProposalStats({ stats }: ProposalStatsProps) {
    const wonStats = stats.find(s => s.status === "won") || { count: 0, totalValue: 0 };
    const lostStats = stats.find(s => s.status === "lost") || { count: 0, totalValue: 0 };
    const pendingStats = stats
        .filter(
            (s) =>
                s.status !== "won" && s.status !== "lost" && s.status !== "cancelled"
        )
        .reduce(
            (acc, curr) => ({
                count: acc.count + Number(curr.count),
                totalValue: acc.totalValue + Number(curr.totalValue),
            }),
            { count: 0, totalValue: 0 }
        );

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
            <Card className="gap-2 border-none py-3 shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Propostas Ganhas
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                </CardHeader>
                <CardContent className="pb-0 pt-0">
                    <div className="text-xl font-bold text-emerald-700">
                        {formatCurrency(wonStats.totalValue)}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {wonStats.count} orçamentos fechados
                    </p>
                </CardContent>
            </Card>

            <Card className="gap-2 border-none py-3 shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Em Aberto / Sent
                    </CardTitle>
                    <ClipboardList className="h-4 w-4 shrink-0 text-blue-500" />
                </CardHeader>
                <CardContent className="pb-0 pt-0">
                    <div className="text-xl font-bold text-blue-700">
                        {formatCurrency(pendingStats.totalValue)}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {pendingStats.count} aguardando resposta
                    </p>
                </CardContent>
            </Card>

            <Card className="gap-2 border-none py-3 shadow-sm bg-gradient-to-br from-rose-500/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                        Perdidas
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 shrink-0 text-rose-500" />
                </CardHeader>
                <CardContent className="pb-0 pt-0">
                    <div className="text-xl font-bold text-rose-700">
                        {formatCurrency(lostStats.totalValue)}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {lostStats.count} orçamentos não convertidos
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
