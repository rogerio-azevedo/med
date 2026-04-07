import * as z from "zod";

export const medicationFormSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  activeIngredient: z.string().trim().min(2, "Princípio ativo deve ter pelo menos 2 caracteres"),
  brandName: z.string().trim().max(255, "Nome comercial deve ter no máximo 255 caracteres").optional(),
  genericName: z.string().trim().max(500, "Nome genérico deve ter no máximo 500 caracteres").optional(),
  concentration: z.string().trim().max(255, "Concentração deve ter no máximo 255 caracteres").optional(),
  pharmaceuticalForm: z.string().trim().min(2, "Forma farmacêutica deve ter pelo menos 2 caracteres").max(100, "Forma farmacêutica deve ter no máximo 100 caracteres"),
  presentation: z.string().trim().max(1000, "Apresentação deve ter no máximo 1000 caracteres").optional(),
  route: z.string().trim().max(100, "Via deve ter no máximo 100 caracteres").optional(),
  manufacturer: z.string().trim().max(255, "Fabricante deve ter no máximo 255 caracteres").optional(),
  anvisaRegistry: z.string().trim().max(50, "Registro ANVISA deve ter no máximo 50 caracteres").optional(),
  therapeuticClass: z.string().trim().max(255, "Classe terapêutica deve ter no máximo 255 caracteres").optional(),
  controlledSubstance: z.boolean(),
  requiresPrescription: z.boolean(),
  status: z.enum(["active", "inactive"], {
    error: "Selecione o status do medicamento",
  }),
});

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;
