"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicServer } from "@/lib/auth/require-clinic-server";
import { documentTemplateSchema } from "@/lib/validations/document-templates";
import {
  createDocumentTemplate as createService,
  updateDocumentTemplate as updateService,
  deleteDocumentTemplate as deleteService,
  renderDocumentTemplate as renderService,
  generateAndSaveDocument as generateService,
  updateGeneratedDocumentContent as updateGeneratedDocumentContentService,
} from "@/services/document-templates";

const optionalEditedDocumentHtmlSchema = z.string().max(400_000).optional();

const updateEditedDocumentBodySchema = z.string().min(1).max(400_000);

export async function createDocumentTemplateAction(formData: FormData) {
  const { currentClinic, user, clinicUser } = await requireClinicServer();

  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    content: formData.get("content") as string,
    visibility: formData.get("visibility") as "private" | "shared",
    hideTitleWhenPrinted: formData.get("hideTitleWhenPrinted") === "true",
    isActive: formData.get("isActive") === "true",
  };

  const parsed = documentTemplateSchema.parse(data);

  await createService(
    parsed,
    currentClinic.id,
    user.id,
    clinicUser.role,
    clinicUser.doctorId || undefined
  );

  revalidatePath("/document-templates");
}

export async function updateDocumentTemplateAction(id: string, formData: FormData) {
  const { currentClinic, user, clinicUser } = await requireClinicServer();

  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    content: formData.get("content") as string,
    visibility: formData.get("visibility") as "private" | "shared",
    hideTitleWhenPrinted: formData.get("hideTitleWhenPrinted") === "true",
    isActive: formData.get("isActive") === "true",
  };

  const parsed = documentTemplateSchema.parse(data);

  await updateService(id, parsed, currentClinic.id, user.id, clinicUser.role);

  revalidatePath("/document-templates");
}

export async function deleteDocumentTemplateAction(id: string) {
  const { currentClinic, user, clinicUser } = await requireClinicServer();

  await deleteService(id, currentClinic.id, user.id, clinicUser.role);

  revalidatePath("/document-templates");
}

export async function renderDocumentTemplateAction(
  templateId: string,
  patientId: string,
  consultationId?: string
) {
  const { currentClinic } = await requireClinicServer();
  return renderService(templateId, patientId, currentClinic.id, consultationId);
}

export async function generateDocumentAction(input: {
  templateId: string;
  patientId: string;
  consultationId?: string;
  editedContent?: string;
}) {
  const { templateId, patientId, consultationId, editedContent } = input;
  const parsed = optionalEditedDocumentHtmlSchema.safeParse(editedContent);
  if (!parsed.success) {
    throw new Error("Conteúdo editado inválido ou muito longo.");
  }

  const { currentClinic, user } = await requireClinicServer();
  const doc = await generateService(templateId, patientId, currentClinic.id, user.id, consultationId, {
    editedContent: parsed.data,
  });
  revalidatePath(`/medical-records/${patientId}`);
  return { id: doc.id };
}

export async function updateGeneratedDocumentContentAction(docId: string, editedContent: string) {
  const parsed = updateEditedDocumentBodySchema.safeParse(editedContent);
  if (!parsed.success) {
    throw new Error("Conteúdo editado inválido ou muito longo.");
  }

  const { currentClinic } = await requireClinicServer();
  const row = await updateGeneratedDocumentContentService(docId, currentClinic.id, parsed.data);
  revalidatePath(`/medical-records/${row.patientId}`);
  return { success: true as const };
}

export async function getTemplatesAction() {
  const { currentClinic, clinicUser } = await requireClinicServer();
  const { getDocumentTemplates } = await import("@/db/queries/document-templates");
  
  const templates = await getDocumentTemplates(
    currentClinic.id,
    clinicUser.doctorId || undefined
  );
  
  return templates;
}

export async function getDocumentTemplateModalPreviewShellAction() {
  const { currentClinic, user, clinicUser } = await requireClinicServer();
  const { getDocumentTemplateModalPreviewShell } = await import(
    "@/db/queries/document-templates/modal-shell-preview"
  );
  return getDocumentTemplateModalPreviewShell(
    currentClinic.id,
    user.id,
    clinicUser.doctorId ?? null
  );
}

