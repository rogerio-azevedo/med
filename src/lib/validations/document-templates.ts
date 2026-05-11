import { z } from "zod";

export const TEMPLATE_CATEGORIES = [
  "atestados",
  "declaracoes",
  "termos_de_consentimento",
  "contratos",
  "relatorios",
  "receitas",
  "encaminhamentos",
  "orientacoes",
  "outros",
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  atestados: "Atestados",
  declaracoes: "Declarações",
  termos_de_consentimento: "Termos de Consentimento",
  contratos: "Contratos",
  relatorios: "Relatórios",
  receitas: "Receitas",
  encaminhamentos: "Encaminhamentos",
  orientacoes: "Orientações",
  outros: "Outros",
};

export const documentTemplateSchema = z.object({
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres").max(255),
  description: z.string().max(500).optional(),
  category: z.enum(TEMPLATE_CATEGORIES, {
    message: "Categoria inválida"
  }),
  content: z.string().min(1, "O conteúdo do modelo não pode estar vazio"),
  visibility: z.enum(["private", "shared"]),
  hideTitleWhenPrinted: z.boolean(),
  isActive: z.boolean(),
});

export type DocumentTemplateFormData = z.infer<typeof documentTemplateSchema>;
