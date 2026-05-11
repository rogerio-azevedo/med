"use server"

import { revalidatePath } from "next/cache";
import { requireClinicServer } from "@/lib/auth/require-clinic-server";
import { documentTemplateSchema } from "@/lib/validations/document-templates";
import {
  createDocumentTemplate as createService,
  updateDocumentTemplate as updateService,
  deleteDocumentTemplate as deleteService,
  renderDocumentTemplate as renderService,
  generateAndSaveDocument as generateService,
} from "@/services/document-templates";

export async function createDocumentTemplateAction(formData: FormData) {
  const { currentClinic, user, clinicUser } = await requireClinicServer();

  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as any,
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
    category: formData.get("category") as any,
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

export async function generateDocumentAction(
  templateId: string,
  patientId: string,
  consultationId?: string
) {
  const { currentClinic, user } = await requireClinicServer();
  const doc = await generateService(templateId, patientId, currentClinic.id, user.id, consultationId);
  revalidatePath(`/medical-records/${patientId}`);
  return doc;
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

