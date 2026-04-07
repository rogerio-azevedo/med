import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../index";
import { medications } from "../schema";

export type MedicationPayload = {
  name: string;
  activeIngredient: string;
  brandName?: string;
  genericName?: string;
  concentration?: string;
  pharmaceuticalForm: string;
  presentation?: string;
  route?: string;
  manufacturer?: string;
  anvisaRegistry?: string;
  therapeuticClass?: string;
  controlledSubstance: boolean;
  requiresPrescription: boolean;
  status: "active" | "inactive";
};

export type MedicationFilters = {
  query?: string;
  status?: "active" | "inactive";
  controlled?: "yes" | "no";
  prescription?: "yes" | "no";
  pharmaceuticalForm?: string;
  page?: number;
  pageSize?: number;
};

function cleanText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildSearchText(data: MedicationPayload) {
  return [
    data.name,
    data.activeIngredient,
    data.brandName,
    data.genericName,
    data.concentration,
    data.pharmaceuticalForm,
    data.presentation,
    data.route,
    data.manufacturer,
    data.anvisaRegistry,
    data.therapeuticClass,
  ]
    .map((item) => item?.trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function normalizeMedicationPayload(data: MedicationPayload) {
  return {
    name: data.name.trim(),
    activeIngredient: data.activeIngredient.trim(),
    brandName: cleanText(data.brandName),
    genericName: cleanText(data.genericName),
    concentration: cleanText(data.concentration),
    pharmaceuticalForm: data.pharmaceuticalForm.trim(),
    presentation: cleanText(data.presentation),
    route: cleanText(data.route),
    manufacturer: cleanText(data.manufacturer),
    anvisaRegistry: cleanText(data.anvisaRegistry),
    therapeuticClass: cleanText(data.therapeuticClass),
    controlledSubstance: data.controlledSubstance,
    requiresPrescription: data.requiresPrescription,
    status: data.status,
    searchText: buildSearchText(data),
  };
}

export async function getMedications() {
  return db.select().from(medications).orderBy(asc(medications.name));
}

export async function getMedicationFilterOptions() {
  const forms = await db
    .selectDistinct({ value: medications.pharmaceuticalForm })
    .from(medications)
    .orderBy(asc(medications.pharmaceuticalForm));

  return {
    pharmaceuticalForms: forms.map((item) => item.value).filter(Boolean),
  };
}

export async function getPaginatedMedications(filters: MedicationFilters = {}) {
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;
  const requestedPage = filters.page && filters.page > 0 ? filters.page : 1;
  const normalizedQuery = cleanText(filters.query);
  const normalizedForm = cleanText(filters.pharmaceuticalForm);

  const conditions = [];

  if (normalizedQuery) {
    conditions.push(
      or(
        ilike(medications.name, `%${normalizedQuery}%`),
        ilike(medications.activeIngredient, `%${normalizedQuery}%`),
        ilike(medications.brandName, `%${normalizedQuery}%`),
        ilike(medications.manufacturer, `%${normalizedQuery}%`),
        ilike(medications.searchText, `%${normalizedQuery}%`)
      )
    );
  }

  if (filters.status) {
    conditions.push(eq(medications.status, filters.status));
  }

  if (filters.controlled === "yes") {
    conditions.push(eq(medications.controlledSubstance, true));
  }

  if (filters.controlled === "no") {
    conditions.push(eq(medications.controlledSubstance, false));
  }

  if (filters.prescription === "yes") {
    conditions.push(eq(medications.requiresPrescription, true));
  }

  if (filters.prescription === "no") {
    conditions.push(eq(medications.requiresPrescription, false));
  }

  if (normalizedForm) {
    conditions.push(eq(medications.pharmaceuticalForm, normalizedForm));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(medications)
    .where(whereClause);

  const total = countResult?.count ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const items = await db
    .select()
    .from(medications)
    .where(whereClause)
    .orderBy(asc(medications.name))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

export async function createMedication(data: MedicationPayload) {
  const [newMedication] = await db
    .insert(medications)
    .values(normalizeMedicationPayload(data))
    .returning();

  return newMedication;
}

export async function updateMedication(id: string, data: MedicationPayload) {
  const [updatedMedication] = await db
    .update(medications)
    .set({ ...normalizeMedicationPayload(data), updatedAt: new Date() })
    .where(eq(medications.id, id))
    .returning();

  return updatedMedication;
}

export async function deleteMedication(id: string) {
  await db.delete(medications).where(eq(medications.id, id));
}
