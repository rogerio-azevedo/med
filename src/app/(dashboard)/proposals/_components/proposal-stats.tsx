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
    const pendingStats = stats.filter(s => s.status !== "won" && s.status !== "lost" && s.status !== "cancelled")
        .reduce((acc, curr) => ({ count: acc.count + curr.count, totalValue: acc.totalValue + curr.totalValue }), { count: 0, totalValue: 0 });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                        Propostas Ganhas
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(wonStats.totalValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {wonStats.count} orçamentos fechados
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                        Em Aberto / Sent
                    </CardTitle>
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700">
                        {formatCurrency(pendingStats.totalValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {pendingStats.count} aguardando resposta
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500/10 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-rose-600 uppercase tracking-wider">
                        Perdidas
                    </CardTitle>
                    <TrendingDown className="h-5 w-5 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-700">
                        {formatCurrency(lostStats.totalValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {lostStats.count} orçamentos não convertidos
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
