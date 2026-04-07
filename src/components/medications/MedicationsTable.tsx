"use client";

import { MoreHorizontal, Pencil, Pill, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteMedicationDialog } from "./DeleteMedicationDialog";
import { EditMedicationDialog } from "./EditMedicationDialog";

interface Medication {
  id: string;
  name: string;
  activeIngredient: string;
  brandName: string | null;
  genericName: string | null;
  concentration: string | null;
  pharmaceuticalForm: string;
  presentation: string | null;
  route: string | null;
  anvisaRegistry: string | null;
  therapeuticClass: string | null;
  controlledSubstance: boolean;
  requiresPrescription: boolean;
  status: "active" | "inactive";
}

export function MedicationsTable({ medications }: { medications: Medication[] }) {
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <div className="max-w-full overflow-hidden rounded-xl border border-muted/20 bg-white/50 shadow-sm backdrop-blur-sm">
        <div className="max-w-full overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="h-11 w-[38%] font-semibold text-foreground/70">Nome</TableHead>
                <TableHead className="h-11 w-[20%] font-semibold text-foreground/70">Princípio Ativo</TableHead>
                <TableHead className="h-11 w-[12%] font-semibold text-foreground/70">Concentração</TableHead>
                <TableHead className="h-11 w-[14%] font-semibold text-foreground/70">Forma</TableHead>
                <TableHead className="h-11 w-[12%] font-semibold text-foreground/70">Status</TableHead>
                <TableHead className="h-11 w-[4%] text-right font-semibold text-foreground/70">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Pill size={32} className="opacity-20" />
                      <p>Nenhum medicamento encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                medications.map((medication) => (
                  <TableRow key={medication.id} className="transition-colors hover:bg-primary/[0.02]">
                    <TableCell className="h-12 py-3 font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="shrink-0 rounded-lg bg-primary/5 p-2 text-primary">
                          <Pill size={16} />
                        </div>
                        <div className="min-w-0 max-w-[320px] space-y-0.5">
                          <div className="truncate text-[15px]">{medication.name}</div>
                          {medication.brandName ? <div className="truncate text-xs text-muted-foreground">{medication.brandName}</div> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] py-3 text-sm text-muted-foreground">
                      <div className="truncate">{medication.activeIngredient}</div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      {medication.concentration || <span className="italic text-muted-foreground/30">Sem concentração</span>}
                    </TableCell>
                    <TableCell className="max-w-[160px] py-3 text-sm text-muted-foreground">
                      <div className="truncate">{medication.pharmaceuticalForm}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                          {medication.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        {medication.requiresPrescription ? <Badge variant="outline">Receita</Badge> : null}
                        {medication.controlledSubstance ? (
                          <Badge variant="outline" className="gap-1">
                            <ShieldAlert className="h-3 w-3" /> Controlado
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 rounded-full p-0 transition-all hover:bg-muted/50">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-muted/20 p-1.5 shadow-xl">
                          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="h-10 cursor-pointer gap-2 rounded-lg px-2 transition-colors focus:bg-primary/5 focus:text-primary"
                            onClick={() => {
                              setSelectedMedication(medication);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="font-medium">Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-muted/20" />
                          <DropdownMenuItem
                            className="h-10 cursor-pointer gap-2 rounded-lg px-2 text-destructive transition-colors focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => {
                              setSelectedMedication(medication);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="font-medium">Remover</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedMedication ? (
        <>
          <EditMedicationDialog medication={selectedMedication} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
          <DeleteMedicationDialog medication={selectedMedication} isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} />
        </>
      ) : null}
    </>
  );
}
