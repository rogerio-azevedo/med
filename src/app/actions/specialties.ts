"use server";

import {
    getSpecialties,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
} from "@/db/queries/specialties";
import { revalidatePath } from "next/cache";

export async function getSpecialtiesAction() {
    try {
        const specialties = await getSpecialties();
        return { success: true, data: specialties };
    } catch (error) {
        return { success: false, error: "Erro ao carregar especialidades" };
    }
}

export async function createSpecialtyAction(data: {
    name: string;
    code?: string;
}) {
    try {
        const newSpecialty = await createSpecialty(data);
        revalidatePath("/specialties");
        return { success: true, data: newSpecialty };
    } catch (error) {
        return { success: false, error: "Erro ao criar especialidade" };
    }
}

export async function updateSpecialtyAction(
    id: string,
    data: { name: string; code?: string }
) {
    try {
        const updatedSpecialty = await updateSpecialty(id, data);
        revalidatePath("/specialties");
        return { success: true, data: updatedSpecialty };
    } catch (error) {
        return { success: false, error: "Erro ao atualizar especialidade" };
    }
}

export async function deleteSpecialtyAction(id: string) {
    try {
        await deleteSpecialty(id);
        revalidatePath("/specialties");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erro ao deletar especialidade" };
    }
}
