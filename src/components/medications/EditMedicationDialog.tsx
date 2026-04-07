"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Pill } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateMedicationAction } from "@/app/actions/medications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { MedicationFormFields } from "./MedicationFormFields";
import { medicationFormSchema, type MedicationFormValues } from "./medication-form-schema";

interface EditMedicationDialogProps {
  medication: {
    id: string;
    name: string;
    activeIngredient: string;
    brandName: string | null;
    genericName: string | null;
    concentration: string | null;
    pharmaceuticalForm: string;
    presentation: string | null;
    route: string | null;
    manufacturer: string | null;
    anvisaRegistry: string | null;
    therapeuticClass: string | null;
    controlledSubstance: boolean;
    requiresPrescription: boolean;
    status: "active" | "inactive";
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMedicationDialog({ medication, isOpen, onOpenChange }: EditMedicationDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: medication.name,
      activeIngredient: medication.activeIngredient,
      brandName: medication.brandName || "",
      genericName: medication.genericName || "",
      concentration: medication.concentration || "",
      pharmaceuticalForm: medication.pharmaceuticalForm,
      presentation: medication.presentation || "",
      route: medication.route || "",
      manufacturer: medication.manufacturer || "",
      anvisaRegistry: medication.anvisaRegistry || "",
      therapeuticClass: medication.therapeuticClass || "",
      controlledSubstance: medication.controlledSubstance,
      requiresPrescription: medication.requiresPrescription,
      status: medication.status,
    },
  });

  useEffect(() => {
    form.reset({
      name: medication.name,
      activeIngredient: medication.activeIngredient,
      brandName: medication.brandName || "",
      genericName: medication.genericName || "",
      concentration: medication.concentration || "",
      pharmaceuticalForm: medication.pharmaceuticalForm,
      presentation: medication.presentation || "",
      route: medication.route || "",
      manufacturer: medication.manufacturer || "",
      anvisaRegistry: medication.anvisaRegistry || "",
      therapeuticClass: medication.therapeuticClass || "",
      controlledSubstance: medication.controlledSubstance,
      requiresPrescription: medication.requiresPrescription,
      status: medication.status,
    });
  }, [form, medication]);

  async function onSubmit(values: MedicationFormValues) {
    setIsPending(true);
    try {
      const result = await updateMedicationAction(medication.id, values);
      if (result.success) {
        toast.success("Medicamento atualizado com sucesso!");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erro ao atualizar medicamento");
      }
    } catch {
      toast.error("Erro ao atualizar medicamento");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-none bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary shadow-inner">
              <Pill size={28} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Editar Medicamento</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground/80">
                Atualize os dados do catálogo de medicamentos.
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <MedicationFormFields control={form.control} />
          </form>
        </Form>

        <DialogFooter className="flex items-center justify-between border-t bg-muted/20 p-6 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="transition-all hover:bg-muted/50">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
            className="min-w-[160px] bg-primary text-white shadow-xl shadow-primary/10 transition-all active:scale-95 hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
