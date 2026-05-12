import { eq, and, or, desc } from "drizzle-orm";
import { db } from "../../index";
import { documentTemplates, generatedDocuments } from "../../schema/document-templates";
import { consultations } from "../../schema/medical-records";
import { doctors } from "../../schema/doctors";
import { users } from "../../schema/auth";
import { getPatientById } from "@/db/queries/patients";

export async function getDocumentTemplates(clinicId: string, doctorId?: string) {
  return db.query.documentTemplates.findMany({
    where: and(
      eq(documentTemplates.clinicId, clinicId),
      eq(documentTemplates.isActive, true),
      doctorId
        ? or(
            eq(documentTemplates.visibility, "shared"),
            eq(documentTemplates.createdByDoctorId, doctorId)
          )
        : eq(documentTemplates.visibility, "shared")
    ),
    orderBy: [desc(documentTemplates.createdAt)],
  });
}

export async function getDocumentTemplateById(id: string, clinicId: string) {
  return db.query.documentTemplates.findFirst({
    where: and(
      eq(documentTemplates.id, id),
      eq(documentTemplates.clinicId, clinicId)
    ),
  });
}

export type NewDocumentTemplate = typeof documentTemplates.$inferInsert;

export async function createDocumentTemplate(data: NewDocumentTemplate) {
  const [template] = await db.insert(documentTemplates).values(data).returning();
  return template;
}

export async function updateDocumentTemplate(id: string, clinicId: string, data: Partial<NewDocumentTemplate>) {
  const [template] = await db
    .update(documentTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(documentTemplates.id, id), eq(documentTemplates.clinicId, clinicId)))
    .returning();
  return template;
}

export async function deleteDocumentTemplate(id: string, clinicId: string) {
  const [template] = await db
    .delete(documentTemplates)
    .where(and(eq(documentTemplates.id, id), eq(documentTemplates.clinicId, clinicId)))
    .returning();
  return template;
}

// Histórico de documentos gerados
export type NewGeneratedDocument = typeof generatedDocuments.$inferInsert;

export async function saveGeneratedDocument(data: NewGeneratedDocument) {
  const [doc] = await db.insert(generatedDocuments).values(data).returning();
  return doc;
}

export async function updateGeneratedDocumentEditedContent(
  docId: string,
  clinicId: string,
  editedContent: string
) {
  const [row] = await db
    .update(generatedDocuments)
    .set({ editedContent })
    .where(and(eq(generatedDocuments.id, docId), eq(generatedDocuments.clinicId, clinicId)))
    .returning();
  return row ?? null;
}

export async function getGeneratedDocuments(patientId: string, clinicId: string) {
  return db.query.generatedDocuments.findMany({
    where: and(
      eq(generatedDocuments.patientId, patientId),
      eq(generatedDocuments.clinicId, clinicId)
    ),
    orderBy: [desc(generatedDocuments.generatedAt)],
  });
}

export async function getTemplateRenderData(patientId: string, clinicId: string, consultationId?: string) {
  const patientRow = await getPatientById(patientId, clinicId);
  if (!patientRow) return null;

  const addresses = patientRow.address ? [{ ...patientRow.address, isPrimary: true }] : [];

  const insRows = [...(patientRow.patientHealthInsurances ?? [])].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
  );
  const healthInsurances = insRows.map((h) => ({
    cardNumber: h.cardNumber,
    healthInsurance: { name: h.name },
  }));

  const patient = {
    id: patientRow.id,
    name: patientRow.name,
    cpf: patientRow.cpf,
    birthDate: patientRow.birthDate,
    sex: patientRow.sex,
    phone: patientRow.phone,
    email: patientRow.email,
    addresses,
    healthInsurances,
  };

  let consultation: {
    startTime: Date;
    surgeryProcedures: { name: string }[];
    doctor?: { user: { name: string | null } };
  } | null = null;

  if (consultationId) {
    const [c] = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.id, consultationId), eq(consultations.clinicId, clinicId)))
      .limit(1);

    if (c) {
      let doctor: { user: { name: string | null } } | undefined;
      if (c.doctorId) {
        const [doc] = await db
          .select({ name: users.name })
          .from(doctors)
          .innerJoin(users, eq(doctors.userId, users.id))
          .where(eq(doctors.id, c.doctorId))
          .limit(1);
        if (doc) {
          doctor = { user: { name: doc.name } };
        }
      }

      consultation = {
        startTime: c.startTime,
        surgeryProcedures: [],
        doctor,
      };
    }
  }

  return { patient, consultation };
}
