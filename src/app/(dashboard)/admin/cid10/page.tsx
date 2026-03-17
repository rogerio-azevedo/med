import { db } from "@/db";
import { icd10Codes } from "@/db/schema";
import { auth } from "@/auth";
import { desc, ilike, or } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash } from "lucide-react";

export default async function Cid10AdminPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const session = await auth();
    // No futuro, adicionar check de role admin aqui
    if (!session?.user?.clinicId) return <div>Não autorizado</div>;

    const query = searchParams.q || "";
    
    const codes = await db
        .select()
        .from(icd10Codes)
        .where(
            query 
                ? or(ilike(icd10Codes.code, `%${query}%`), ilike(icd10Codes.description, `%${query}%`))
                : undefined
        )
        .orderBy(desc(icd10Codes.createdAt))
        .limit(100);

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento CID-10</h1>
                    <p className="text-muted-foreground">Adicione ou edite códigos de diagnóstico do sistema.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Código
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por código ou descrição..." 
                        className="pl-10"
                        defaultValue={query}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Capítulo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {codes.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-bold text-primary">{item.code}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.chapter || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash className="h-4 w-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
