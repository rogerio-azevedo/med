"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, EyeOff, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteProductAction, toggleProductStatusAction } from "@/app/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PackageDialog } from "./package-dialog";

interface Product {
    id: string;
    type: "plan_package" | "surgery" | "exam" | "consultation" | "other";
    name: string;
    description: string | null;
    costPrice: number;
    sellingPrice: number;
    isActive: boolean;
}

interface PackagesTableProps {
    products: Product[];
}

export function PackagesTable({ products }: PackagesTableProps) {
    const router = useRouter();

    async function onDelete(id: string) {
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        try {
            const result = await deleteProductAction(id);
            if (result.success) {
                toast.success("Produto excluído com sucesso!");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Erro ao excluir produto");
        }
    }

    async function onToggleStatus(id: string, currentStatus: boolean) {
        try {
            const result = await toggleProductStatusAction(id, !currentStatus);
            if (result.success) {
                toast.success(`Produto ${!currentStatus ? "ativado" : "desativado"} com sucesso!`);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Erro ao alterar status");
        }
    }

    const typeLabels: Record<string, string> = {
        plan_package: "Plano/Pacote",
        surgery: "Cirurgia",
        exam: "Exame",
        consultation: "Consulta",
        other: "Outro",
    };

    if (products.length === 0) {
        return (
            <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/20">
                <p>Nenhum produto cadastrado ainda.</p>
                <PackageDialog />
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold text-right">Custo</TableHead>
                        <TableHead className="font-semibold text-right">Venda</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-foreground">{product.name}</span>
                                    {product.description && (
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {product.description}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="font-normal">
                                    {typeLabels[product.type]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="text-muted-foreground">{formatCurrency(product.costPrice)}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                                {formatCurrency(product.sellingPrice)}
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge
                                    variant={product.isActive ? "default" : "outline"}
                                    className={product.isActive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""}
                                >
                                    {product.isActive ? "Ativo" : "Inativo"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <PackageDialog initialData={{
                                            ...product,
                                            description: product.description || undefined
                                        }}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                        </PackageDialog>
                                        <DropdownMenuItem onClick={() => onToggleStatus(product.id, product.isActive)}>
                                            {product.isActive ? (
                                                <><EyeOff className="mr-2 h-4 w-4" /> Desativar</>
                                            ) : (
                                                <><Eye className="mr-2 h-4 w-4" /> Ativar</>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:bg-destructive/10"
                                            onClick={() => onDelete(product.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
