import { getSpecialtiesAction } from "@/app/actions/specialties";
import { SpecialtiesTable } from "@/components/specialties/SpecialtiesTable";
import { AddSpecialtyDialog } from "@/components/specialties/AddSpecialtyDialog";
import { Tag } from "lucide-react";

export default async function SpecialtiesPage() {
    const result = await getSpecialtiesAction();
    const specialties = result.success ? result.data || [] : [];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Especialidades</h2>
                    <p className="text-muted-foreground font-medium mt-1">
                        Gerencie as especialidades médicas cadastradas no sistema.
                    </p>
                </div>
                <AddSpecialtyDialog />
            </div>

            <div className="grid gap-6">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-white/40 backdrop-blur-sm border border-muted/20 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                                <Tag size={20} />
                            </div>
                            <h3 className="font-semibold text-lg text-foreground/80">Lista de Especialidades</h3>
                            <div className="ml-auto px-3 py-1 bg-muted/50 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-muted/20">
                                {specialties.length} {specialties.length === 1 ? 'Item' : 'Itens'}
                            </div>
                        </div>
                        <SpecialtiesTable specialties={specialties} />
                    </div>
                </div>
            </div>
        </div>
    );
}
