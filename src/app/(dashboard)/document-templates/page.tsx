import { redirect } from "next/navigation";
import { requireClinicServer } from "@/lib/auth/require-clinic-server";
import { can } from "@/lib/permissions";
import { getDocumentTemplates } from "@/db/queries/document-templates";
import { deleteDocumentTemplate } from "@/services/document-templates";
import { DocumentTemplateList } from "@/components/document-templates/DocumentTemplateList";
import { PageHeader } from "@/components/shared/PageHeader";
import { revalidatePath } from "next/cache";

export default async function DocumentTemplatesPage() {
  const { currentClinic, clinicUser, user } = await requireClinicServer();

  const allowed = await can("document-templates", "can_read");
  if (!allowed) redirect("/dashboard");


  const templates = await getDocumentTemplates(
    currentClinic.id,
    clinicUser.doctorId || undefined
  );

  const isOwnerOrAdmin = clinicUser.role === "admin" || clinicUser.role === "owner";

  async function deleteAction(id: string) {
    "use server";
    const { currentClinic, clinicUser, user } = await requireClinicServer();
    await deleteDocumentTemplate(id, currentClinic.id, user.id, clinicUser.role);
    revalidatePath("/document-templates");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader 
        title="Modelos de Documentos" 
        description="Gerencie os modelos de atestados, receitas e outros documentos da clínica." 
      />
      
      <DocumentTemplateList 
        templates={templates as any} 
        deleteAction={deleteAction}
        userId={user.id}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  );
}
