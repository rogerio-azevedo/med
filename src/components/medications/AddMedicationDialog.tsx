"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Pill, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createMedicationAction } from "@/app/actions/medications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { MedicationFormFields } from "./MedicationFormFields";
import { medicationFormSchema, type MedicationFormValues } from "./medication-form-schema";

export function AddMedicationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: "",
      activeIngredient: "",
      brandName: "",
      genericName: "",
      concentration: "",
      pharmaceuticalForm: "",
      presentation: "",
      route: "",
      manufacturer: "",
      anvisaRegistry: "",
      therapeuticClass: "",
      controlledSubstance: false,
      requiresPrescription: true,
      status: "active",
    },
  });

  async function onSubmit(values: MedicationFormValues) {
    setIsPending(true);
    try {
      const result = await createMedicationAction(values);
      if (result.success) {
        toast.success("Medicamento cadastrado com sucesso!");
        form.reset();
        setIsOpen(false);
      } else {
        toast.error(result.error || "Erro ao cadastrar medicamento");
      }
    } catch {
      toast.error("Erro ao cadastrar medicamento");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Medicamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-none bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary shadow-inner">
              <Pill size={28} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90">Novo Medicamento</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground/80">
                Cadastre um medicamento para formar a base de autocomplete e prescrição futura.
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
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="transition-all hover:bg-muted/50">
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
                <Check className="mr-2 h-4 w-4" /> Cadastrar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
