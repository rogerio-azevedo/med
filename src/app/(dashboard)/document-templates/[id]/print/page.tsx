import { requireClinicServer } from "@/lib/auth/require-clinic-server";
import { getDocumentTemplateById } from "@/db/queries/document-templates";
import { db } from "@/db";
import { generatedDocuments } from "@/db/schema/document-templates";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PrintDocumentView } from "@/components/document-templates/PrintDocumentView";
import { getClinicById } from "@/db/queries/clinics";

export default async function PrintDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ docId?: string }>;
}) {
  const { id } = await params;
  const { docId } = await searchParams;
  const { currentClinic } = await requireClinicServer();

  if (!docId) {
    return <div>ID do documento gerado é obrigatório.</div>;
  }

  // Fetch the generated document
  const document = await db.query.generatedDocuments.findFirst({
    where: eq(generatedDocuments.id, docId),
  });

  if (!document || document.clinicId !== currentClinic.id) {
    notFound();
  }

  // Fetch the template to know if we should hide the title
  const template = await getDocumentTemplateById(id, currentClinic.id);
  
  // Fetch clinic info
  const clinic = await getClinicById(currentClinic.id);
  if (!clinic) notFound();

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto print:static print:bg-transparent">
      {/* 
        O className 'fixed inset-0 z-50 bg-white' cobre toda a interface do dashboard 
        na tela normal, escondendo a sidebar visualmente sem precisar mudar o layout do Next.js.
      */}
      <PrintDocumentView 
        document={document} 
        template={template || undefined}
        clinic={clinic}
        doctor={null} // TODO: fetch doctor info from generated document if needed, or pass null
      />
    </div>
  );
}
