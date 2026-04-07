"use server";

import { revalidatePath } from "next/cache";
import {
  createMedication,
  deleteMedication,
  getMedicationFilterOptions,
  getPaginatedMedications,
  updateMedication,
  type MedicationFilters,
  type MedicationPayload,
} from "@/db/queries/medications";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getMedicationsAction(filters?: MedicationFilters) {
  try {
    const medications = await getPaginatedMedications(filters);
    return { success: true, data: medications };
  } catch (error) {
    console.error("Error loading medications:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao carregar medicamentos") };
  }
}

export async function getMedicationFilterOptionsAction() {
  try {
    const options = await getMedicationFilterOptions();
    return { success: true, data: options };
  } catch (error) {
    console.error("Error loading medication filter options:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao carregar filtros de medicamentos"),
    };
  }
}

export async function createMedicationAction(data: MedicationPayload) {
  try {
    const newMedication = await createMedication(data);
    revalidatePath("/medications");
    return { success: true, data: newMedication };
  } catch (error) {
    console.error("Error creating medication:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao criar medicamento") };
  }
}

export async function updateMedicationAction(id: string, data: MedicationPayload) {
  try {
    const updatedMedication = await updateMedication(id, data);
    revalidatePath("/medications");
    return { success: true, data: updatedMedication };
  } catch (error) {
    console.error("Error updating medication:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar medicamento") };
  }
}

export async function deleteMedicationAction(id: string) {
  try {
    await deleteMedication(id);
    revalidatePath("/medications");
    return { success: true };
  } catch (error) {
    console.error("Error deleting medication:", error);
    return { success: false, error: getErrorMessage(error, "Erro ao remover medicamento") };
  }
}
