import {
  createDocumentTemplate as createQuery,
  updateDocumentTemplate as updateQuery,
  deleteDocumentTemplate as deleteQuery,
  getTemplateRenderData,
  getDocumentTemplateById,
  saveGeneratedDocument,
  NewDocumentTemplate,
} from "../db/queries/document-templates";
import { parseTemplate } from "../utils/parse-template";

export async function createDocumentTemplate(
  data: Omit<
    NewDocumentTemplate,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "clinicId"
    | "createdByUserId"
    | "createdByDoctorId"
  >,
  clinicId: string,
  userId: string,
  clinicRole: string,
  doctorId?: string
) {
  if (clinicRole !== "doctor" && clinicRole !== "admin" && clinicRole !== "owner") {
    throw new Error("Apenas médicos ou administradores podem criar modelos de documentos.");
  }

  const templateData: NewDocumentTemplate = {
    ...data,
    clinicId,
    createdByUserId: userId,
    createdByDoctorId: clinicRole === "doctor" ? doctorId : null,
  };

  return createQuery(templateData);
}

export async function updateDocumentTemplate(
  id: string,
  data: Partial<NewDocumentTemplate>,
  clinicId: string,
  userId: string,
  clinicRole: string
) {
  const existing = await getDocumentTemplateById(id, clinicId);
  if (!existing) {
    throw new Error("Modelo não encontrado.");
  }

  // Apenas o criador ou um admin/owner pode editar
  const isAdminOrOwner = clinicRole === "admin" || clinicRole === "owner";
  const isCreator = existing.createdByUserId === userId;

  if (!isAdminOrOwner && !isCreator) {
    throw new Error("Você não tem permissão para editar este modelo.");
  }

  return updateQuery(id, clinicId, data);
}

export async function deleteDocumentTemplate(
  id: string,
  clinicId: string,
  userId: string,
  clinicRole: string
) {
  const existing = await getDocumentTemplateById(id, clinicId);
  if (!existing) {
    throw new Error("Modelo não encontrado.");
  }

  const isAdminOrOwner = clinicRole === "admin" || clinicRole === "owner";
  const isCreator = existing.createdByUserId === userId;

  if (!isAdminOrOwner && !isCreator) {
    throw new Error("Você não tem permissão para excluir este modelo.");
  }

  return deleteQuery(id, clinicId);
}

export async function renderDocumentTemplate(
  templateId: string,
  patientId: string,
  clinicId: string,
  consultationId?: string
) {
  const template = await getDocumentTemplateById(templateId, clinicId);
  if (!template) {
    throw new Error("Modelo não encontrado.");
  }

  const renderData = await getTemplateRenderData(patientId, clinicId, consultationId);
  if (!renderData) {
    throw new Error("Dados do paciente não encontrados.");
  }

  const renderedContent = parseTemplate(template.content, renderData);

  return {
    templateId: template.id,
    title: template.title,
    originalContent: template.content,
    renderedContent,
    hideTitleWhenPrinted: template.hideTitleWhenPrinted,
  };
}

export async function generateAndSaveDocument(
  templateId: string,
  patientId: string,
  clinicId: string,
  userId: string,
  consultationId?: string
) {
  const rendered = await renderDocumentTemplate(templateId, patientId, clinicId, consultationId);

  const doc = await saveGeneratedDocument({
    templateId: rendered.templateId,
    clinicId,
    patientId,
    consultationId: consultationId || null,
    title: rendered.title,
    originalContent: rendered.originalContent,
    renderedContent: rendered.renderedContent,
    generatedByUserId: userId,
  });

  return doc;
}
