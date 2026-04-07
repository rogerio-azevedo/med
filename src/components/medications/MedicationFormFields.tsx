import type { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { MedicationFormValues } from "./medication-form-schema";

interface MedicationFormFieldsProps {
  control: Control<MedicationFormValues>;
}

export function MedicationFormFields({ control }: MedicationFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Dipirona monoidratada 500 mg comprimido" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="activeIngredient"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Princípio Ativo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Dipirona monoidratada" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="brandName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Comercial</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Novalgina" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="genericName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Genérico</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Metamizol sódico" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name="concentration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Concentração</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: 500 mg" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="pharmaceuticalForm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma Farmacêutica</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Comprimido" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Via</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Oral" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="presentation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apresentação</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ""} placeholder="Ex: Caixa com 20 comprimidos" className="min-h-20 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name="manufacturer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabricante</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Sanofi" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="anvisaRegistry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registro ANVISA</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: 1234567890123" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="therapeuticClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classe Terapêutica</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Analgésico" className="h-11 border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 w-full border-muted-foreground/10 bg-muted/30 transition-all focus:border-primary/30">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="controlledSubstance"
          render={({ field }) => (
            <FormItem className="flex min-h-11 flex-row items-center justify-between rounded-xl border border-muted/20 bg-muted/20 px-4 py-3">
              <div className="space-y-1">
                <FormLabel>Controlado</FormLabel>
                <FormDescription className="text-xs">Marca se o medicamento exige controle especial.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="requiresPrescription"
          render={({ field }) => (
            <FormItem className="flex min-h-11 flex-row items-center justify-between rounded-xl border border-muted/20 bg-muted/20 px-4 py-3">
              <div className="space-y-1">
                <FormLabel>Exige Receita</FormLabel>
                <FormDescription className="text-xs">Indica se a venda depende de prescrição.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
