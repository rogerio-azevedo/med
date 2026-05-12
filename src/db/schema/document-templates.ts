import { pgTable, uuid, text, varchar, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { doctors } from "./doctors";
import { users } from "./auth";
import { patients } from "./patients";
import { consultations } from "./medical-records";

// Enum de visibilidade do modelo
export const templateVisibilityEnum = pgEnum("template_visibility", ["private", "shared"]);

// Enum de categoria — lista fechada, consistente no banco
export const templateCategoryEnum = pgEnum("template_category", [
  "atestados",
  "declaracoes",
  "termos_de_consentimento",
  "contratos",
  "relatorios",
  "receitas",
  "encaminhamentos",
  "orientacoes",
  "outros",
]);

// Tabela principal dos modelos
export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  // Quem criou o modelo: médico ou admin. Null = sistema.
  createdByDoctorId: uuid("created_by_doctor_id").references(() => doctors.id, { onDelete: "set null" }),
  createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: templateCategoryEnum("category").notNull(),
  content: text("content").notNull(), // Texto com @@atalhos
  visibility: templateVisibilityEnum("visibility").default("private").notNull(),
  hideTitleWhenPrinted: boolean("hide_title_when_printed").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documentos gerados (histórico imutável)
export const generatedDocuments = pgTable("generated_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => documentTemplates.id, { onDelete: "set null" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  // consultationId é OPCIONAL — geração avulsa não tem consulta vinculada
  consultationId: uuid("consultation_id").references(() => consultations.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  originalContent: text("original_content").notNull(), // Snapshot do template no momento da geração
  renderedContent: text("rendered_content").notNull(), // Conteúdo final com atalhos substituídos (canônico do servidor)
  /** Conteúdo após edição pelo médico no modal; null = impressão usa rendered_content */
  editedContent: text("edited_content"),
  generatedByUserId: text("generated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});
