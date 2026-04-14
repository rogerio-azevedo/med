import { Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AddScoreItemDialog } from "@/components/score-items/AddScoreItemDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScoreItemsTable } from "@/components/score-items/ScoreItemsTable";
import { getScoreItems } from "@/db/queries/score-items";

export default async function ScoresPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const scoreItems = await getScoreItems(clinicId);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <PageHeader
                title="Pontuações"
                description="Gerencie o catálogo de pontuações usado pela clínica."
                actions={<AddScoreItemDialog />}
            />

            <div className="group relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
                <div className="relative rounded-2xl border border-muted/20 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                            <Activity size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/80">Catálogo de Pontuações</h3>
                        <div className="ml-auto rounded-full border border-muted/20 bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {scoreItems.length} {scoreItems.length === 1 ? "item" : "itens"}
                        </div>
                    </div>

                    <ScoreItemsTable scoreItems={scoreItems} />
                </div>
            </div>
        </div>
    );
}
