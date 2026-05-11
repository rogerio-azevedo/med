import { requireClinicServer } from "@/lib/auth/require-clinic-server";
import { getDocumentTemplateById } from "@/db/queries/document-templates";
import { DocumentTemplateForm } from "@/components/document-templates/DocumentTemplateForm";
import { createDocumentTemplateAction, updateDocumentTemplateAction } from "@/app/actions/document-templates";
import { notFound } from "next/navigation";

export default async function DocumentTemplateFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { currentClinic, clinicUser, user } = await requireClinicServer();
  const isNew = id === "new";

  let initialData = undefined;
  let creatorId: string | null | undefined;

  if (!isNew) {
    const template = await getDocumentTemplateById(id, currentClinic.id);
    if (!template) {
      notFound();
    }

    creatorId = template.createdByUserId;

    initialData = {
      id: template.id,
      title: template.title,
      description: template.description || undefined,
      category: template.category,
      content: template.content,
      visibility: template.visibility,
      hideTitleWhenPrinted: template.hideTitleWhenPrinted,
      isActive: template.isActive,
    };
  }

  const isOwnerOrAdmin = clinicUser.role === "admin" || clinicUser.role === "owner";

  async function actionFn(formData: FormData) {
    "use server";
    if (isNew) {
      await createDocumentTemplateAction(formData);
    } else {
      await updateDocumentTemplateAction(id, formData);
    }
  }

  return (
    <div className="flex-1 p-8 pt-6 h-full">
      <DocumentTemplateForm 
        initialData={initialData as any}
        actionFn={actionFn}
        isOwnerOrAdmin={isOwnerOrAdmin}
        userId={user.id}
        creatorId={isNew ? undefined : creatorId}
      />
    </div>
  );
}
